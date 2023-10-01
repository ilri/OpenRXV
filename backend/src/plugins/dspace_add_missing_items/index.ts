import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Job } from 'bull';
import { map } from 'rxjs/operators';
import { DSpaceService } from '../../harvesters/DSpace/dspace.service';
import { DSpace7Service } from '../../harvesters/DSpace7/dspace7.service';

@Injectable()
export class AddMissingItems {
    constructor(
        private http: HttpService,
        public readonly elasticsearchService: ElasticsearchService,
        private readonly dspaceService: DSpaceService,
        private readonly dspace7Service: DSpace7Service,
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
