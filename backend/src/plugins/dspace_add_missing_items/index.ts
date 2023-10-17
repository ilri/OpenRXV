import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchRequest, SearchResponse, OpenPointInTimeResponse } from '@elastic/elasticsearch/lib/api/types';
import { Job } from 'bull';
import { map } from 'rxjs/operators';
import { DSpaceService } from '../../harvesters/DSpace/dspace.service';
import { DSpace7Service } from '../../harvesters/DSpace7/dspace7.service';
import Sitemapper from 'sitemapper';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';

@Injectable()
export class AddMissingItems {
    private logger = new Logger('dspace_add_missing_items');
    constructor(
        private http: HttpService,
        public readonly elasticsearchService: ElasticsearchService,
        public readonly jsonFilesService: JsonFilesService,
        private readonly dspaceService: DSpaceService,
        private readonly dspace7Service: DSpace7Service,
    ) {}
    plugin_name = 'dspace_add_missing_items'

    async start(queue, name: string, index_name: string, concurrency: number) {
        queue.process(name, concurrency, async (job: Job<any>) => {
            // Remove the "/" from the end of the job.data.itemEndPoint
            job.data.itemEndPoint = job.data.itemEndPoint.replace(/\/$/gm, '');

            await job.takeLock();
            let url: string;
            if (job.data.repo.type === 'DSpace') {
                url = `${job.data.itemEndPoint}/${job.data.identifier}?expand=metadata,parentCommunityList,parentCollectionList,bitstreams`;
            } else if (job.data.repo.type === 'DSpace7') {
                // We don't know how many parent communities there are, we will get the first 10 only
                const owningCollectionEmbed = 'owningCollection/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity';
                const mappedCollectionsEmbed = 'mappedCollections/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity/parentCommunity';
                url = `${job.data.itemEndPoint}/${job.data.identifier}?embed=${owningCollectionEmbed},${mappedCollectionsEmbed},thumbnail`;
            }
            const result = await lastValueFrom(
                this.http
                    .get(url)
                    .pipe(map((d) => d.data))
            ).catch(() => null);
            await job.progress(50);

            if (result && result.type == 'item') {
                let formatted;
                if (job.data.repo.type === 'DSpace') {
                    const mappingValues = this.dspaceService.getMappingValues(job.data.index, false);
                    formatted = this.dspaceService.formatter(result, job.data.repo.schema, mappingValues);
                } else if (job.data.repo.type === 'DSpace7') {
                    const mappingValues = this.dspace7Service.getMappingValues(job.data.index, false);
                    formatted = this.dspace7Service.formatter(result, job.data.repo.schema, mappingValues);
                }

                if (job.data.repo.years) {
                    const split = job.data.repo.years.split(/_(.+)/);

                    if (formatted[split[1]]) {
                        if (typeof formatted[split[1]] === 'string')
                            formatted[job.data.repo.years] = formatted[split[1]].split('-')[0];
                        if (
                            Array.isArray(formatted[split[1]]) &&
                            typeof formatted[split[1]][0] === 'string'
                        )
                            formatted[job.data.repo.years] =
                                formatted[split[1]][0].split('-')[0];
                    }
                }
                formatted['id'] = result.uuid ? result.uuid : result.id;
                formatted['repo'] = job.data.repo.name;
                await job.progress(70);
                await this.elasticsearchService
                    .index({index: job.data.index + '_temp', document: formatted})
                    .catch((e) => {
                        console.log(e)
                        job.moveToFailed(e, true)
                    });
                await job.progress(100);
                return 'done';
            }
            return 'done';
        });
    }

    async getIdentifiers(repo, sitemapIdentifier): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const openPointInTime: OpenPointInTimeResponse = await this.elasticsearchService.openPointInTime({
                    index: repo.index_name + '_temp',
                    keep_alive: '5m',
                }).catch(() => {
                    return null;
                });

                const elastic_data: SearchRequest = {
                    size: 9999,
                    _source: [sitemapIdentifier],
                    track_total_hits: true,
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        'repo.keyword': repo.name,
                                    },
                                },
                                {
                                    exists: {field: sitemapIdentifier},
                                },
                            ],
                        },
                    },
                    sort: [{'uuid.keyword': 'asc'}],
                };

                if (openPointInTime?.id) {
                    elastic_data.pit = {
                        id: openPointInTime.id,
                        keep_alive: '5m'
                    }
                }

                const allRecords = [];

                const getMoreUntilDone = async () => {
                    const response: SearchResponse = await this.elasticsearchService
                        .search(elastic_data)
                        .catch((e) => {
                            this.logger.error(e);
                            return null;
                        });

                    if (response?.hits?.hits.length > 0) {
                        response.hits.hits
                            .map((d) => {
                                const identifier = (d._source as any)[sitemapIdentifier];
                                if (identifier)
                                    allRecords.push(identifier);
                            });

                        elastic_data.search_after = response.hits.hits.at(-1).sort;

                        await getMoreUntilDone();
                    }
                };

                await getMoreUntilDone();

                if (openPointInTime?.id) {
                    await this.elasticsearchService.closePointInTime({
                        id: openPointInTime.id,
                    }).catch(() => {
                        return null;
                    });
                }

                resolve(allRecords);
            } catch (e) {
                this.logger.error(e);
                reject(e);
            }
        });
    }

    async addJobs(queue, plugin_name, data, index_name: string) {
        if (plugin_name !== `${index_name}_plugins_${this.plugin_name}`)
            return;

        try {
            this.logger.log('Started DSpace health check for ' + data.repo);
            const settings = await this.jsonFilesService.read(
                '../../../data/dataToUse.json',
            );

            if (!settings.hasOwnProperty(index_name)) {
                return {success: false};
            }

            const repo = settings[index_name].repositories.filter((d) => d.name == data.repo)[0];
            const Sitemap = new Sitemapper({
                url: repo.siteMap,
                timeout: 15000, // 15 seconds
                requestHeaders: {
                    'User-Agent': 'OpenRXV harvesting bot; https://github.com/ilri/OpenRXV',
                },
            });
            this.logger.log('Getting ' + data.repo + ' sitemap ' + repo.siteMap);

            const {sites} = await Sitemap.fetch();

            repo.index_name = index_name;

            let itemsIdentifiers = [];
            let sitemapIdentifiers = [];
            if (data?.sitemapIdentifier === 'handle') {
                sitemapIdentifiers = sites.map((d) => d.split('/handle/')[1]);
            } else if (data?.sitemapIdentifier === 'uuid') {
                sitemapIdentifiers = sites.map((d) => d.split('/').at(-1));
            } else {
                this.logger.log('sitemap Identifier is not defined for the plugin ' + repo.siteMap);
                return {success: false};
            }

            if (repo.type === 'DSpace7') {
                const collectionsCommunitiesIds = await this.getCollectionsCommunitiesIds(repo.itemsEndPoint);

                for (let i = 0; i < collectionsCommunitiesIds.length; i++) {
                    const index = sitemapIdentifiers.indexOf(collectionsCommunitiesIds[i]);
                    if (index !== -1) {
                        sitemapIdentifiers.splice(index,1);
                    }
                }
            }
            this.logger.log('Items sitemap identifiers found ' + sitemapIdentifiers.length);

            console.log('repo => ', JSON.stringify(repo));
            itemsIdentifiers = await this.getIdentifiers(repo, data.sitemapIdentifier).catch((e) => {
                return null;
            });
            this.logger.log('Existing identifiers ' + itemsIdentifiers.length);

            for (let i = 0; i < itemsIdentifiers.length; i++) {
                const index = sitemapIdentifiers.indexOf(itemsIdentifiers[i]);
                if (index !== -1) {
                    sitemapIdentifiers.splice(index,1);
                }
            }
            this.logger.log('Missing identifiers found ' + sitemapIdentifiers.length);

            if (queue) {
                for (let i = 0; i < sitemapIdentifiers.length; i++) {
                    await queue.add(`${index_name}_plugins_dspace_add_missing_items`, {
                        index: index_name,
                        repo,
                        sitemapIdentifier: data.sitemapIdentifier,
                        identifier: sitemapIdentifiers[i],
                        itemEndPoint: data.itemEndPoint
                    }, {
                        attempts: 0,
                        priority: 0,
                        delay: 200,
                        backoff: {
                            type: 'exponential',
                            delay: 1000,
                        },
                    });
                }
                this.logger.log('Missing identifiers for ' + data.repo + ' added to the Queue');
            } else {
                this.logger.log('Missing identifiers for ' + data.repo + ' queue not found');
            }
            this.logger.log('Finished DSpace health check for ' + data.repo);
            return {success: true};
        } catch (e) {
            return {success: false};
        }
    }

    async getCollectionsCommunitiesIds(endPoint) {
        // Remove the "/" from the end of the endPoint
        endPoint = endPoint.replace(/\/$/gm, '');

        const uuids = [];
        const communitiesRequest = await lastValueFrom(
            this.http.get(`${endPoint}/discover/search/objects?dsoType=community&size=1&page=0`)
        ).catch(() => {
            return null;
        });
        if (communitiesRequest?.data?._embedded?.searchResult?.page?.totalElements && communitiesRequest.data._embedded.searchResult.page.totalElements > 0) {
            const totalPages = Math.ceil(communitiesRequest.data._embedded.searchResult.page.totalElements / 100);
            for (let page = 0; page < totalPages; page++) {
                const data = await lastValueFrom(
                    this.http.get(`${endPoint}/discover/search/objects?dsoType=community&size=100&page=${page}`)
                ).catch(() => {
                    return null;
                });
                const communities = data?.data?._embedded?.searchResult?._embedded?.objects;
                if (communities) {
                    communities.map((communityObject) => {
                        const uuid = communityObject?._embedded?.indexableObject?.uuid;
                        if (uuid) {
                            uuids.push(uuid);
                        }
                    });
                }
            }
        }

        const collectionsRequest = await lastValueFrom(
            this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&size=1&page=0`)
        ).catch(() => {
            return null;
        });

        if (collectionsRequest?.data?._embedded?.searchResult?.page?.totalElements && collectionsRequest.data._embedded.searchResult.page.totalElements > 0) {
            const totalPages = Math.ceil(collectionsRequest.data._embedded.searchResult.page.totalElements / 100);
            for (let page = 0; page < totalPages; page++) {
                const data = await lastValueFrom(
                    this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&size=100&page=${page}`)
                ).catch(() => {
                    return null;
                });
                const collections = data?.data?._embedded?.searchResult?._embedded?.objects;
                if (collections) {
                    collections.map((collectionObject) => {
                        const uuid = collectionObject?._embedded?.indexableObject?.uuid;
                        if (uuid) {
                            uuids.push(uuid);
                        }
                    });
                }
            }
        }

        return uuids;
    }
}
