import { Processor, Process, OnGlobalQueueDrained } from '@nestjs/bull';
import { Job } from 'bull';
import { HttpService, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiResponse } from '@elastic/elasticsearch';
import { FormatSearvice } from '../../shared/services/formater.service';
@Processor('fetch')
export class FetchConsumer {
  private logger = new Logger(FetchConsumer.name);
  timeout;
  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
    private readonly formatService: FormatSearvice,
  ) {}

  @Process({ name: 'DSpace', concurrency: 5 })
  async transcode(job: Job<any>) {
    try {
      await job.takeLock();
      await job.progress(20);
      this.formatService.Init();
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
          job.progress(60);
          return await this.index(job, data);
        }
      }
    } catch (e) {
      job.moveToFailed(e, true);
    }
  }
  async index(job: Job<any>, data) {
    const finaldata: Array<any> = [];

    data.forEach((item: any) => {
      const formated = this.formatService.format(item, job.data.repo.schema);

      if (job.data.repo.years) {
        const spleted = job.data.repo.years.split(/_(.+)/);

        if (formated[spleted[1]]) {
          if (typeof formated[spleted[1]] === 'string')
            formated[job.data.repo.years] = formated[spleted[1]].split('-')[0];
          if (
            Array.isArray(formated[spleted[1]]) &&
            typeof formated[spleted[1]][0] === 'string'
          )
            formated[job.data.repo.years] =
              formated[spleted[1]][0].split('-')[0];
        }
      }
      formated['id'] = item.uuid ? item.uuid.toString() : item.id.toString();
      formated['repo'] = job.data.repo.name;
      finaldata.push({ index: { _index: process.env.OPENRXV_TEMP_INDEX } });
      finaldata.push(formated);
    });

    job.progress(70);

    const resp: ApiResponse = await this.elasticsearchService.bulk({
      refresh: 'wait_for',
      body: finaldata,
    });
    job.progress(90);

    resp.body.items.forEach((item: any, index: number) => {
      //item.index.status
      if (item.index.status != 200 && item.index.status != 201) {
        const error = new Error('error update or create item ');
        error.stack = item.index;
        job.attemptsMade = 10;
        job.moveToFailed(error, true);
      }
    });
    job.progress(100);
    return resp;
  }

  @OnGlobalQueueDrained()
  async onDrained(job: Job) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(async () => {
      this.logger.log('OnGlobalQueueDrained');
    }, 12000);
  }
}
