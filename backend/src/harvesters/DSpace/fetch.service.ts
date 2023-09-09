import { Job } from 'bull';
import { HttpService, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiResponse } from '@elastic/elasticsearch';
import { FormatService } from '../../shared/services/formater.service';

@Injectable()
export class FetchService {
    timeout;

    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        private http: HttpService,
        private readonly formatService: FormatService,
    ) {
    }

    async RegisterProcess(queue, name: string, index_name: string) {
        queue.process(name, 5, async (job: Job<any>) => {
            try {
                await job.takeLock();
                await job.progress(20);
                await this.formatService.Init(index_name);
                const offset = parseInt(job.data.page) * 10;
                const url =
                    job.data.repo.itemsEndPoint +
                    '/items?expand=metadata,parentCommunityList,parentCollectionList,bitstreams' +
                    '&limit=10&offset=' +
                    offset;

                const request = await this.http
                    .get(url)
                    .toPromise()
                    .catch((d) => {
                        job.moveToFailed(new Error(d), true);
                        return null;
                    });
                if (request) {
                    const data = request.data;
                    await job.progress(50);
                    if (Array.isArray(data) && data.length == 0) {
                        return 'done';
                    } else {
                        await job.progress(60);
                        return await this.process(job, data);
                    }
                }
            } catch (e) {
                await job.moveToFailed(e, true);
            }
        });
    }

    async process(job: Job<any>, data) {
        const finaldata: Array<any> = [];

        for (const item of data) {
            const formatted = this.formatService.format(item, job.data.repo.schema);

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

        const resp: ApiResponse = await this.elasticsearchService.bulk({
            refresh: 'wait_for',
            body: finaldata,
        });
        await job.progress(90);

        for (const item of resp.body.items) {
            if (item.index.status != 200 && item.index.status != 201) {
                const error = new Error('error update or create item ');
                error.stack = item.index;
                job.attemptsMade = 10;
                await job.moveToFailed(error, true);
            }
        }
        await job.progress(100);
        return resp;
    }
}