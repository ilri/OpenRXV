import { Logger, HttpService, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Job } from 'bull';
import { map } from 'rxjs/operators';
import { FormatService } from '../../shared/services/formater.service';

@Injectable()
export class AddMissingItems {
  private logger = new Logger('AddMissingItems');

  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
    private formatService: FormatService,
  ) {}
  async start(queue, name: string, index_name: string, concurrency: number) {
    queue.process(name, concurrency, async (job: Job<any>) => {
      await job.takeLock();
      const url =
          job.data.itemEndPoint +
          `/${job.data.handle}?expand=metadata,parentCommunityList,parentCollectionList,bitstreams`;
      const result = await this.http
          .get(url)
          .pipe(map((d) => d.data))
          .toPromise()
          .catch((d) => null);
      await job.progress(50);
      if (result && result.type == 'item') {
        await this.formatService.Init(index_name);
        const formated = this.formatService.format(result, job.data.repo.schema);
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
        formated['id'] = result.uuid ? result.uuid : result.id;
        formated['repo'] = job.data.repo.name;
        await job.progress(70);
        await this.elasticsearchService
            .index({index: job.data.index, body: formated})
            .catch((e) => job.moveToFailed(e, true));
        await job.progress(100);
        return 'done';
      }
      return 'done';
    });
  }
}
