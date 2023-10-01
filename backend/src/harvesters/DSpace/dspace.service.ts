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
export class DSpaceService {
    harvesterName = 'DSpace';
    mappingValues: any = {};
    private readonly logger = new Logger(`${this.harvesterName} harvester`);
    timeout;

    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        private http: HttpService,
        private readonly formatService: FormatService,
    ) {
    }

    async getMappingValues(index_name, forceGet) {
        if (forceGet || !this.mappingValues.hasOwnProperty(index_name)) {
            this.mappingValues[index_name] = await this.formatService.getMappingValues(index_name);
        }
        return this.mappingValues[index_name];
    }

    async RegisterProcess(queue) {
        queue.process(this.harvesterName, 5, async (job: Job<any>) => {
            // Remove the "/" from the end of the job.data.repo.itemsEndPoint
            job.data.repo.itemsEndPoint = job.data.repo.itemsEndPoint.replace(/\/$/gm, '');

            try {
                await job.takeLock();
                await job.progress(20);
                const offset = parseInt(job.data.page) * 10;
                const url =
                    job.data.repo.itemsEndPoint +
                    '/items?expand=metadata,parentCommunityList,parentCollectionList,bitstreams' +
                    '&limit=10&offset=' +
                    offset;

                const request = await lastValueFrom(this.http.get(url))
                    .catch((d) => {
                        job.moveToFailed(new Error(d), true);
                        return null;
                    });
                const data = request?.data;
                if (data) {
                    await job.progress(50);
                    if (Array.isArray(data) && data.length == 0) {
                        return 'done';
                    } else {
                        await job.progress(60);
                        return await this.process(job, data);
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
        const finaldata: Array<any> = [];

        for (const item of data) {
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
            finaldata.push({index: {_index: job.data.repo.index_name + '_temp'}});
            finaldata.push(formatted);
        }

        await job.progress(70);
        const resp: BulkResponse = await this.elasticsearchService.bulk({
            refresh: 'wait_for',
            operations: finaldata,
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
        }
        await job.progress(100);
        return resp;
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
        _.each(schemas, (schemaItems: any, schemaName: string) => {
            if (harvestedItem[schemaName]) {
                if (_.isArray(schemaItems)) { // These are metadata and bitstreams
                    _.each(schemaItems, (schemaItem: any) => {
                        const schemaValueName = Object.keys(schemaItem.value)[0];
                        const schemaKeyName = Object.keys(schemaItem.where)[0];
                        const addOn = schemaItem.addOn ? schemaItem.addOn : null;

                        const values = harvestedItem[schemaName]
                            .filter((metadataElement: any) => {
                                return metadataElement[schemaKeyName] == schemaItem.where[schemaKeyName];
                            })
                            .map((metadataElement: any) => {
                                const value = metadataElement[schemaValueName];
                                const mappedValue = this.formatService.mapIt(value, addOn, schemaItem.value.value, mappingValues);
                                return schemaItem.prefix ? schemaItem.prefix + mappedValue : mappedValue;
                            })
                            .filter(v => v !== '' && v != null);
                        if (values.length)
                            finalValues[schemaItem.value[schemaValueName]] = this.formatService.setValue(
                                finalValues[schemaItem.value[schemaValueName]],
                                this.formatService.getArrayOrValue(values),
                            );
                    });
                } else if (_.isObject(schemaItems)) {
                    const titleFieldName = Object.keys(schemaItems)[0];
                    const metadataField = schemaItems[titleFieldName];
                    const addOn = schemaItems?.addOn;
                    if (_.isArray(harvestedItem[schemaName])) {  // These are expands (collections, communities, ...)
                        const mappedValues = harvestedItem[schemaName]
                            .map((metadataElement: any) => this.formatService.mapIt(metadataElement[titleFieldName], null, null, mappingValues), addOn)
                            .filter(v => v !== '' && v != null);
                        const values = this.formatService.getArrayOrValue(mappedValues);
                        if (values)
                            finalValues[metadataField] = this.formatService.setValue(
                                finalValues[metadataField],
                                values,
                            );
                    } else { // These are item basic information (id, name, handle, archived, ...)
                        const mappedValue = this.formatService.mapIt(harvestedItem[schemaName], addOn, null, mappingValues);
                        if (mappedValue !== '' && mappedValue != null) {
                            finalValues[schemaName] = mappedValue;
                        }
                    }
                }
            }
        });
        return finalValues;
    }
}
