import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { HttpService } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Queue, Job } from 'bull';
import { map } from 'rxjs/operators';

@Processor('plugins')
export class DSpaceDownloadsAndViews {
  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
    @InjectQueue('plugins') private pluginQueue: Queue,
  ) {}
  @Process({ name: 'dspace_downloads_and_views', concurrency: 1 })
  async transcode(job: Job<any>) {
    let link = job.data.link;
    let page = job.data.page;
    job.progress(20);
    let toUpdateIndexes: Array<any> = [];
    let stats = await this.http
      .get(`${link}?page=${page}&limit=100`)
      .pipe(map((d) => d.data))
      .toPromise();
    job.progress(50);
    if (stats.statistics && stats.statistics.length > 0) {
      let searchResult = await this.elasticsearchService.search({
        index: process.env.OPENRXV_TEMP_INDEX,
        body: {
          _source: ['_id', 'id'],
          track_total_hits: true,
          size: 100,
          query: {
            bool: {
              must: [
                {
                  match: {
                    'repo.keyword': job.data.repo,
                  },
                },
                {
                  terms: {
                    'id.keyword': stats.statistics.map((d) => d.id),
                  },
                },
              ],
            },
          },
        },
      });

      if (
        searchResult &&
        searchResult.body &&
        searchResult.body.hits.total.value > 0
      ) {
        let IDs = {};
        searchResult.body.hits.hits.forEach((element) => {
          IDs[element._source.id] = element._id;
        });
        stats.statistics.forEach((stat: any) => {
          if (IDs[stat.id]) {
            toUpdateIndexes.push({
              update: {
                _index: process.env.OPENRXV_TEMP_INDEX,
                _id: IDs[stat.id],
              },
            });
            toUpdateIndexes.push({
              doc: {
                numbers: {
                  views: parseInt(stat.views),
                  downloads: parseInt(stat.downloads),
                  score: parseInt(stat.views) + parseInt(stat.downloads),
                },
              },
            });
          }
        });
      }
      job.progress(70);

      if (toUpdateIndexes.length > 0) {
        await this.pluginQueue.add('dspace_downloads_and_views', {
          page: page + 1,
          link,
          repo: job.data.repo,
        });
        let currentResult = await await this.elasticsearchService.bulk({
          refresh: 'wait_for',
          body: toUpdateIndexes,
        });
        job.progress(100);
        return currentResult;
      } else {
        job.progress(100);
        await this.pluginQueue.add('dspace_downloads_and_views', {
          page: page + 1,
          link,
          repo: job.data.repo,
        });
        return 'nothing to Update';
      }
    } else {
      job.progress(100);
      return 'Done updating downloads and views';
    }
  }
}
