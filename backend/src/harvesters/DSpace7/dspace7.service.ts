import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { BulkResponse } from '@elastic/elasticsearch/lib/api/types';
import { FormatService } from '../../shared/services/formater.service';

@Injectable()
export class DSpace7Service {
    timeout;
    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        private http: HttpService,
        private readonly formatService: FormatService,
    ) {}

    async RegisterProcess(queue, name: string, index_name: string) {
        queue.process(name, 0, async (job: Job<any>) => {
            // Remove the "/" from the end of the job.data.repo.itemsEndPoint
            job.data.repo.itemsEndPoint = job.data.repo.itemsEndPoint.replace(/\/$/gm, '');

            try {
                await job.takeLock();
                await job.progress(20);
                await this.formatService.Init(index_name);

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
                const formatted = this.formatService.DSpace7Format(item, job.data.repo.schema);

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
        }
        await job.progress(100);
        return resp;
    }
}
