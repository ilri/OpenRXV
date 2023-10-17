import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BulkResponse } from '@elastic/elasticsearch/lib/api/types';
import { FormatService } from '../../shared/services/formater.service';
import Sitemapper from 'sitemapper';
import * as _ from 'underscore';

@Injectable()
export class DSpace7Service {
    harvesterName = 'DSpace7';
    mappingValues: any = {};
    private readonly logger = new Logger(`${this.harvesterName} harvester`);
    timeout;
    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        private http: HttpService,
        private readonly formatService: FormatService,
    ) {}

    async getMappingValues(index_name, forceGet) {
        if (forceGet || !this.mappingValues.hasOwnProperty(index_name)) {
            this.mappingValues[index_name] = await this.formatService.getMappingValues(index_name);
        }
        return this.mappingValues[index_name];
    }

    async RegisterProcess(queue) {
        queue.process(this.harvesterName, 0, async (job: Job<any>) => {
            // Remove the "/" from the end of the job.data.repo.itemsEndPoint
            job.data.repo.itemsEndPoint = job.data.repo.itemsEndPoint.replace(/\/$/gm, '');

            try {
                await job.takeLock();
                await job.progress(20);

                // We don't know how many parent communities there are, we will get the first 10 only
                const owningCollectionEmbed = 'owningCollection/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity';
                const mappedCollectionsEmbed = 'mappedCollections/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity';
                const url =
                    job.data.repo.itemsEndPoint +
                    `/discover/search/objects?dsoType=item&embed=thumbnail,${owningCollectionEmbed},${mappedCollectionsEmbed}` +
                    `&size=10&page=${job.data.page}`;

                const request = await lastValueFrom(this.http.get(url))
                    .catch((d) => {
                        job.moveToFailed(new Error(d), true);
                        return null;
                    });
                const data = request?.data?._embedded?.searchResult?._embedded?.objects;
                if (data) {
                    await job.progress(50);
                    if (Array.isArray(data) && data.length == 0) {
                        return 'done';
                    } else {
                        await job.progress(60);
                        const response = await this.process(job, data);
                        if (response) {
                            await job.progress(100);
                        }
                    }
                } else {
                    await job.moveToFailed({message: 'no response'}, true);
                }
            } catch (e) {
                await job.moveToFailed(e, true);
            }
        });
    }

    async process(job: Job<any>, data) {
        await this.getMappingValues(job.data.repo.index_name, false);
        const finalData: Array<any> = [];

        for (const harvested of data) {
            if (harvested?._embedded?.indexableObject) {
                const item = harvested._embedded.indexableObject;
                const formatted = this.formatter(item, job.data.repo.schema, this.mappingValues[job.data.repo.index_name]);

                if (job.data.repo.years) {
                    const spleted = job.data.repo.years.split(/_(.+)/);

                    if (formatted[spleted[1]]) {
                        if (typeof formatted[spleted[1]] === 'string')
                            formatted[job.data.repo.years] = formatted[spleted[1]].split('-')[0];
                        if (Array.isArray(formatted[spleted[1]]) && typeof formatted[spleted[1]][0] === 'string')
                            formatted[job.data.repo.years] = formatted[spleted[1]][0].split('-')[0];
                    }
                }
                formatted['id'] = item.uuid ? item.uuid.toString() : item.id.toString();
                formatted['repo'] = job.data.repo.name;
                finalData.push({index: {_index: job.data.repo.index_name + '_temp'}});
                finalData.push(formatted);
            }
        }

        await job.progress(70);

        const resp: BulkResponse = await this.elasticsearchService.bulk({
            refresh: 'wait_for',
            operations: finalData,
        });
        await job.progress(90);

        if (resp.errors) {
            for (const item of resp.items) {
                if (item.index.status != 200 && item.index.status != 201) {
                    const error = new Error('error update or create item ');
                    error.stack = item.index.error.stack_trace;
                    job.attemptsMade = 10;
                    await job.moveToFailed(error, true);
                }
            }
            return false;
        } else {
            return true;
        }
    }

    async addJobs(queue, repository) {
        // Get a fresh copy of the values mapping
        await this.getMappingValues(repository.index_name, true);

        const Sitemap = new Sitemapper({
            url: repository.siteMap,
            timeout: 15000, // 15 seconds
        });
        try {
            const {sites} = await Sitemap.fetch();
            const itemsCount = sites.length;
            this.logger.debug('Starting Harvest => ' + itemsCount);
            // DSpace pages starts from 0, thus the pages are shifted by -1
            const pages = Math.floor(itemsCount / 10);

            let page_number = repository?.startPage && Number(repository.startPage) >= 0 ? Number(repository.startPage) : 0;
            for (page_number; page_number <= pages; page_number++) {
                queue.add(repository.type, {page: page_number, repo: repository});
            }
        } catch (error) {
            this.logger.error('Starting Harvest => ' + error);
        }
    }

    formatter(harvestedItem: any, schemas: any, mappingValues: any) {
        const finalValues: any = {};
        let communities = [];
        let communityTitleFieldName = null;
        let communityMetadataField = null;
        let communityAddOn = null;
        if (schemas?.parentCommunity && _.isObject(schemas.parentCommunity)) {
            communityTitleFieldName = Object.keys(schemas.parentCommunity)[0];
            communityMetadataField = schemas.parentCommunity[communityTitleFieldName];
            communityAddOn = schemas.parentCommunity?.addOn;
        }

        _.each(schemas, (schemaItems: any, schemaName: string) => {
            if (_.isArray(schemaItems)) { // These are metadata
                if (harvestedItem[schemaName]) {
                    _.each(schemaItems, (schemaItem: any) => {
                        const schemaValueName = Object.keys(schemaItem.value)[0];
                        const schemaKeyName = Object.keys(schemaItem.where)[0];
                        const addOn = schemaItem.addOn ? schemaItem.addOn : null;

                        for (const metadataFieldName in harvestedItem[schemaName]) {
                            if (harvestedItem[schemaName].hasOwnProperty(metadataFieldName)) {
                                if (metadataFieldName === schemaItem.where[schemaKeyName]) {
                                    const values = [];
                                    const metadataElements = harvestedItem[schemaName][metadataFieldName];
                                    metadataElements.map((metadataElement) => {
                                        if (metadataElement.hasOwnProperty(schemaValueName)) {
                                            const mappedValue = this.formatService.mapIt(metadataElement[schemaValueName], addOn, schemaItem.value.value, mappingValues);
                                            const value = schemaItem.prefix ? schemaItem.prefix + mappedValue : mappedValue;
                                            if (value !== '' && value != null) {
                                                values.push(value);
                                            }
                                        }
                                    });
                                    if (values.length)
                                        finalValues[schemaItem.value[schemaValueName]] = this.formatService.setValue(
                                            finalValues[schemaItem.value[schemaValueName]],
                                            this.formatService.getArrayOrValue(values),
                                        );
                                }
                            }
                        }
                    });
                }
            } else if (_.isObject(schemaItems) && schemaName !== 'parentCommunity') {
                const titleFieldName = Object.keys(schemaItems)[0];
                const metadataField = schemaItems[titleFieldName];
                const addOn = schemaItems?.addOn;

                if (harvestedItem.hasOwnProperty(schemaName)) { // These are item basic information (id, name, handle, archived, ...)
                    const mappedValue = this.formatService.mapIt(harvestedItem[schemaName], addOn, null, mappingValues);
                    if (mappedValue !== '' && mappedValue != null) {
                        finalValues[schemaName] = mappedValue;
                    }
                } else { // These are expands (collections, communities, bitstreams, ...)
                    let embeddedItem = harvestedItem?._embedded && harvestedItem._embedded.hasOwnProperty(schemaName) ? harvestedItem._embedded[schemaName] : null;

                    if (embeddedItem?._embedded && embeddedItem._embedded.hasOwnProperty(schemaName)) {
                        embeddedItem = embeddedItem._embedded[schemaName];
                    }

                    if (embeddedItem && !_.isArray(embeddedItem) && _.isObject(embeddedItem)) {
                        embeddedItem = [embeddedItem];
                    }

                    if (embeddedItem && _.isArray(embeddedItem)) {
                        let values = null;
                        if (schemaName === 'thumbnail') {
                            if (embeddedItem[0]?._links?.content.href) {
                                values = embeddedItem[0]._links.content.href;
                            }
                        } else {
                            const mappedValues = embeddedItem
                                .map((metadataElement: any) => {
                                    if (metadataElement?._embedded?.parentCommunity) {
                                        communities = this.formatService.extractParentCommunities(metadataElement._embedded.parentCommunity, communities, communityTitleFieldName);
                                    }
                                    return this.formatService.mapIt(metadataElement[titleFieldName], addOn, null, mappingValues);
                                })
                                .filter(v => v !== '' && v != null);
                            values = this.formatService.getArrayOrValue(mappedValues);
                        }
                        if (values)
                            finalValues[metadataField] = this.formatService.setValue(
                                finalValues[metadataField],
                                values,
                            );
                    }
                }
            }
        });

        // Add parentCommunity
        communities = [...new Set(communities)];
        if (communities.length > 0 && communityMetadataField) {
            const mappedValues = communities
                .map((community: any) => {
                    return this.formatService.mapIt(community, communityAddOn, null, mappingValues);
                })
                .filter(v => v !== '' && v != null);
            const values = this.formatService.getArrayOrValue(mappedValues);

            if (values)
                finalValues[communityMetadataField] = this.formatService.setValue(
                    finalValues[communityMetadataField],
                    values,
                );
        }

        return finalValues;
    }
}
