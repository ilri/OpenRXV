import { Logger, HttpService, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Job } from 'bull';
import { map } from 'rxjs/operators';

@Injectable()
export class DSpaceAltmetrics {
  private logger = new Logger('DSpaceAltmetrics');
  handlesIds: any = null;
  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
  ) {}

  plugin_name = 'dspace_altmetrics'

  async start(queue, name: string, concurrency: number) {
    queue.process(name, concurrency, async (job: Job<any>) => {
      const page = job.data.page;
      if (page == 1) this.handlesIds = null;
      this.handlesIds = await this.generateCache(job.data.index);
      const handle_prefix = job.data.handle_prefix;

      await job.progress(20);
      const Allindexing: Array<any> = [];
      const data: any = await this.http
          .get(`https://api.altmetric.com/v1/citations/at?num_results=100&handle_prefix=${handle_prefix}&page=${page}`)
          .pipe(map((data: any) => data.data))
          .toPromise();
      if (data.results) {
        data.results.forEach((element: any) => {
          const altmetric = {
            score: element.score,
            readers: element.readers_count,
            mentions: element.cited_by_accounts_count,
          };
          if (this.handlesIds[element.handle]) {
            Allindexing.push({
              update: {
                _index: job.data.index,
                _id: this.handlesIds[element.handle],
              },
            });
            Allindexing.push({doc: {altmetric}});
          }
        });
        await job.progress(80);
        if (Allindexing.length) {
          const currentResult: any = await this.elasticsearchService.bulk({
            refresh: 'wait_for',
            body: Allindexing,
          });
          await job.progress(100);
          return currentResult;
        } else {
          return 'No Data to add';
        }
      }
    });
  }

  async generateCache(index) {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.handlesIds != null) {
          resolve(this.handlesIds);
          return;
        }
        let allRecords: any = [];
        const elastic_data = {
          index: index,
          body: {
            size: 500,
            _source: ['handle'],
            track_total_hits: true,
            query: {
              exists: { field: 'handle' },
            },
          },
          scroll: '10m',
        };
        const response3 = await this.elasticsearchService
            .search(elastic_data)
            .catch((e) => this.logger.error(e));
        const getMoreUntilDone = async (response) => {
          if (response?.body?.hits?.hits) {
            const handleID = response.body.hits.hits.map((d: any) => {
              if (d._source.handle) {
                const obj: any = {};
                obj[d._source.handle] = d._id;
                return obj;
              }
            });

            allRecords = [...allRecords, ...handleID];
            if (response.body.hits.total.value !== allRecords.length) {
              const response2 = await this.elasticsearchService
                  .scroll({
                    scroll_id: <string>response.body._scroll_id,
                    scroll: '10m',
                  })
                  .catch((e) => this.logger.error(e));
              await getMoreUntilDone(response2);
            } else {
              this.elasticsearchService.clear_scroll({
                scroll_id: response.body._scroll_id
              }).catch();
              const finalobj: any = {};
              allRecords.forEach((element: any) => {
                finalobj[Object.keys(element)[0]] = Object.values(element)[0];
              });
              resolve(finalobj);
            }
          }
        };
        await getMoreUntilDone(response3);
      } catch (e) {
        this.logger.error(e);
        reject(e);
      }
    });
  }

  async addJobs(queue, plugin_name, data, index_name: string) {
    if (plugin_name !== this.plugin_name)
      return;

    try {
      const items: any = await this.http
          .get(`https://api.altmetric.com/v1/citations/at?num_results=1&handle_prefix=${data.handle_prefix}&page=1`)
          .pipe(map((d) => d.data))
          .toPromise();
      if (items?.query?.total) {
        let currentPage = 0;
        const totalPages = Math.ceil(items.query.total / 100);
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
