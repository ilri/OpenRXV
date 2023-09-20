import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Job } from 'bull';
import { map } from 'rxjs/operators';
import { FormatService } from '../../shared/services/formater.service';

@Injectable()
export class AddMissingItems {
    constructor(
        private http: HttpService,
        public readonly elasticsearchService: ElasticsearchService,
        private formatService: FormatService,
    ) {}

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
                await this.formatService.Init(index_name);
                let formatted;
                if (job.data.repo.type === 'DSpace') {
                    formatted = this.formatService.format(result, job.data.repo.schema);
                } else if (job.data.repo.type === 'DSpace7') {
                    formatted = this.formatService.DSpace7Format(result, job.data.repo.schema);
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
                    .index({index: job.data.index, document: formatted})
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
}
