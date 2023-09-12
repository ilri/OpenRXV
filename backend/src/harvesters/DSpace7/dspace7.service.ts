import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BulkResponse, BulkResponseItem } from '@elastic/elasticsearch/lib/api/types';
import { FormatService } from '../../shared/services/formater.service';

@Injectable()
export class DSpace7Service {
    timeout;
    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        private http: HttpService,
        private readonly formatService: FormatService,
    ) {}

    collections: any = {};
    collectionsFetching: any = {};

    async RegisterProcess(queue, name: string, index_name: string) {
        queue.process(name, 0, async (job: Job<any>) => {
            try {
                await job.takeLock();
                await job.progress(20);
                await this.formatService.Init(index_name);

                if (!this.collectionsFetching || !this.collectionsFetching.hasOwnProperty(job.data.repo.name) || !this.collectionsFetching[job.data.repo.name])
                    this.collectionsFetching[job.data.repo.name] = this.getCollections(job.data.repo.itemsEndPoint, job.data.repo.name);
                await this.collectionsFetching[job.data.repo.name];

                const url =
                    job.data.repo.itemsEndPoint +
                    '/discover/search/objects?dsoType=item&embed=thumbnail,owningCollection,mappedCollections' +
                    '&size=10&page=' +
                    (job.data.page);

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
        const finalData: Array<any> = [];

        for (const harvested of data) {
            if (harvested?._embedded?.indexableObject) {
                const item = harvested._embedded.indexableObject;
                const formatted = this.formatService.DSpace7Format(item, job.data.repo.schema, this.collections[job.data.repo.name]);

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

        for (const item of resp.items) {
            if ((item as BulkResponseItem).status != 200 && (item as BulkResponseItem).status != 201) {
                const error = new Error('error update or create item ');
                error.stack = (item as BulkResponseItem).error.stack_trace;
                job.attemptsMade = 10;
                await job.moveToFailed(error, true);
            }
        }
        await job.progress(100);
        return resp;
    }

    async getCommunities(endPoint) {
        return new Promise(async (resolve) => {
            const communitiesList = {};

            const request = await lastValueFrom(
                this.http.get(`${endPoint}/discover/search/objects?dsoType=community&embed=parentCommunity&size=1&page=0`)
            ).catch(() => {
                return null;
            });

            if (request?.data?._embedded?.searchResult?.page?.totalElements && request.data._embedded.searchResult.page.totalElements > 0) {
                const totalPages = Math.ceil(request.data._embedded.searchResult.page.totalElements / 100);
                for (let page = 0; page < totalPages; page++) {
                    const data = await lastValueFrom(
                        this.http.get(`${endPoint}/discover/search/objects?dsoType=community&embed=parentCommunity&size=100&page=${page}`)
                    ).catch((d) => {
                        return null;
                    });
                    const communities = data?.data?._embedded?.searchResult?._embedded?.objects;
                    if (communities) {
                        communities.map((communityObject) => {
                            const community = communityObject?._embedded?.indexableObject;
                            if (community) {
                                communitiesList[community.uuid] = {
                                    name: community.name,
                                    parent: null
                                }
                                const parentCommunity = community?._embedded?.parentCommunity;
                                if (parentCommunity) {
                                    communitiesList[community.uuid].parent = parentCommunity.uuid
                                }
                            }
                        });
                    }
                }
            }

            const communities = {};
            for (const communityId in communitiesList) {
                if (communitiesList.hasOwnProperty(communityId)) {
                    const community = communitiesList[communityId];
                    let parentId = community.parent;
                    communities[communityId] = {
                        name: community.name,
                        parents: []
                    }
                    while (parentId) {
                        if (communitiesList.hasOwnProperty(parentId)) {
                            const parent = communitiesList[parentId];
                            communities[communityId].parents.push(parent.name);
                            parentId = parent.parent;
                        }
                    }
                }
            }

            resolve(communities);
        });
    }

    async getCollections(endPoint, repositoryName) {
        if (this.collectionsFetching[repositoryName]) {
            return this.collectionsFetching[repositoryName];
        } else {
            const communities = await this.getCommunities(endPoint);

            const collectionsList = {};
            return new Promise(async (resolve) => {
                const request = await lastValueFrom(
                    this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&embed=parentCommunity&size=1&page=0`)
                ).catch((d) => {
                    return null;
                });

                if (request?.data?._embedded?.searchResult?.page?.totalElements && request.data._embedded.searchResult.page.totalElements > 0) {
                    const totalPages = Math.ceil(request.data._embedded.searchResult.page.totalElements / 100);
                    for (let page = 0; page < totalPages; page++) {
                        const data = await lastValueFrom(
                            this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&embed=parentCommunity&size=100&page=${page}`)
                        ).catch((d) => {
                            return null;
                        });
                        const collections = data?.data?._embedded?.searchResult?._embedded?.objects;
                        if (collections) {
                            collections.map((collectionObject) => {
                                const collection = collectionObject?._embedded?.indexableObject;
                                if (collection) {
                                    collectionsList[collection.uuid] = {
                                        name: collection.name,
                                        parentCommunities: []
                                    }
                                    const parentCommunity = collection?._embedded?.parentCommunity;
                                    if (parentCommunity && communities.hasOwnProperty(parentCommunity.uuid)) {
                                        const parentCommunities = communities[parentCommunity.uuid].parents;
                                        parentCommunities.push(communities[parentCommunity.uuid].name);
                                        collectionsList[collection.uuid].parentCommunities = [...new Set(parentCommunities)];
                                    }
                                }
                            });
                        }
                    }
                }

                this.collections[repositoryName] = collectionsList;
                resolve(true);
            });
        }
    }
}
