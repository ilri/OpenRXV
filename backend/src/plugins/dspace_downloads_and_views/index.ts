import { HttpService, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Job } from 'bull';
import { map } from 'rxjs/operators';

@Injectable()
export class DSpaceDownloadsAndViews {
  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
  ) {}

  plugin_name = 'dspace_downloads_and_views'

  async start(queue, name: string, concurrency: number) {
    queue.process(name, concurrency, async (job: Job<any>) => {
      if (job.data?.aborted) {
        await job.moveToFailed({message: job.data?.aborted_message}, true);
        return 'aborted';
      }

      const link = job.data.link;
      const page = job.data.page;
      await job.progress(20);
      const toUpdateIndexes: Array<any> = [];
      const stats = await this.http
          .get(`${link}?page=${page}&limit=100`)
          .pipe(map((d) => d.data))
          .toPromise();
      await job.progress(50);
      if (stats.statistics && stats.statistics.length > 0) {
        const searchResult = await this.elasticsearchService.search({
          index: job.data.index,
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
          const IDs = {};
          searchResult.body.hits.hits.forEach((element) => {
            IDs[element._source.id] = element._id;
          });
          stats.statistics.forEach((stat: any) => {
            if (IDs[stat.id]) {
              toUpdateIndexes.push({
                update: {
                  _index: job.data.index,
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
        await job.progress(70);

        if (toUpdateIndexes.length > 0) {
          const currentResult = await this.elasticsearchService.bulk({
            refresh: 'wait_for',
            body: toUpdateIndexes,
          });
          await job.progress(100);
          return currentResult;
        } else {
          await job.progress(100);
          return 'nothing to Update';
        }
      } else {
        await job.progress(100);
        return 'Done updating downloads and views';
      }
    });
  }

  async addJobs(queue, plugin_name, data, index_name: string) {
    if (plugin_name !== this.plugin_name)
      return;

    try {
      const stats = await this.http
          .get(`${data.link}?page=1&limit=1`)
          .pipe(map((d) => d.data))
          .toPromise();
      if (stats?.totalPages > 0 || stats?.total_pages > 0) {
        let currentPage = stats.currentPage || stats.current_page;
        const totalPages = Math.ceil((stats.totalPages / 100) || (stats.total_pages / 100));

        for (currentPage; currentPage <= totalPages; currentPage++) {
          await queue.add(plugin_name, {
            ...data,
            page: currentPage,
            index: `${index_name}_temp`,
          });
        }
      }
    } catch (e) {
      await queue.add(plugin_name, {
        aborted: true,
        aborted_message: 'Failed to initialize plugin',
      });
    }
  }
}
