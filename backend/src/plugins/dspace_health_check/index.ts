import { Logger, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchRequest, SearchResponse } from '@elastic/elasticsearch/lib/api/types';
import { Job } from 'bull';
import Sitemapper from 'sitemapper';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';

@Injectable()
export class DSpaceHealthCheck {
  private logger = new Logger('dspace_health_check');
  constructor(
    public readonly elasticsearchService: ElasticsearchService,
    public readonly jsonFilesService: JsonFilesService,
  ) {}

  plugin_name = 'dspace_health_check'

  async start(queue, name: string, index_name: string, concurrency: number) {
    queue.process(name, concurrency, async (job: Job<any>) => {
      try {
        await job.takeLock();
        this.logger.log('Started DSpace health check for ' + job.data.repo);
        const settings = await this.jsonFilesService.read(
            '../../../data/dataToUse.json',
        );

        if (!settings.hasOwnProperty(index_name)) {
          await job.moveToFailed({message: 'Index not found in settings'}, true);
          return {success: false};
        }

        const repo = settings[index_name].repositories.filter(
            (d) => d.name == job.data.repo,
        )[0];
        await job.progress(30);
        const Sitemap = new Sitemapper({
          url: repo.siteMap,
          timeout: 15000, // 15 seconds
          requestHeaders: {
            'User-Agent':
                'OpenRXV harvesting bot; https://github.com/ilri/OpenRXV',
          },
        });
        this.logger.log('Getting ' + job.data.repo + ' sitemap ' + repo.siteMap);

        const {sites} = await Sitemap.fetch();
        await job.progress(50);
        const sitemapHandles = sites.map((d) => d.split('/handle/')[1]);

        repo.index_name = job.data.index;
        const indexedHandles = await this.getHandles(repo).catch((e) => {
          job.moveToFailed(e, true);
          return null;
        });
        await job.progress(80);
        const missingHandles = sitemapHandles.filter(
            (e) => !indexedHandles.includes(e),
        );
        this.logger.log('Missing handles found ' + missingHandles.length);

        for (let i = 0; i < missingHandles.length; i++) {
          await queue.add('dspace_add_missing_items', {
            index: job.data.index,
            repo,
            handle: missingHandles[i],
            itemEndPoint: job.data.itemEndPoint
          }, {
            attempts: 0
          });
        }
        this.logger.log(
            'Missing handles for ' + job.data.repo + ' added to the Queue',
        );
        this.logger.log('Finished DSpace health check for ' + job.data.repo);
        await job.progress(100);
        return {success: true};
      } catch (e) {
        await job.moveToFailed(e, true);
        return {success: false};
      }
    });
  }

  async deleteDuplicates(job: Job) {
    const elastic_data: SearchRequest = {
      index: job.data.index,
      size: 0,
      _source: ['handle'],
      track_total_hits: true,
      query: {
        bool: {
          must: [
            {
              match: {
                'repo.keyword': job.data.repo.name,
              },
            },
            {
              exists: { field: 'handle' },
            },
          ],
        },
      },
      aggs: {
        duplicateCount: {
          terms: {
            field: 'handle.keyword',
            min_doc_count: 2,
            size: 999,
          },
          aggs: {
            duplicateDocuments: {
              top_hits: {
                size: 100,
                _source: ['handle'],
              },
            },
          },
        },
      },
    };
    const response: SearchResponse = await this.elasticsearchService
      .search(elastic_data)
      .catch((e) => {
        this.logger.error(e);
        job.moveToFailed(e, true);
        return null;
      });

    const duplicates = [];
    if (response) {
      this.logger.log('Searching for duplicate handles for ' + job.data.repo);
      for (const item of (response.aggregations.duplicateCount as any).buckets) {
        for (const element of item.duplicateDocuments.hits.hits) {
          let index = 0;
          if (item.duplicateDocuments.hits.hits.length - 1 > index) {
            duplicates.push(element._id);
            await this.elasticsearchService
                .delete({
                  id: element._id,
                  index: job.data.index,
                })
                .catch((e) => this.logger.error(e));
          }
          index++;
        }
      }
      if (duplicates.length > 0) {
        setTimeout(() => {
          this.logger.log(
            duplicates.length +
              ' duplicate handles deleted in ' +
              job.data.repo,
          );
        }, 2000);
        return true;
      }
    }

    return false;
  }

  async getHandles(repo): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let allRecords: any = [];
        const elastic_data: SearchRequest = {
          index: repo.index_name,
          size: 9999,
          _source: ['handle'],
          track_total_hits: true,
          query: {
            bool: {
              must: [
                {
                  match: {
                    'repo.keyword': repo.name,
                  },
                },
                {
                  exists: { field: 'handle' },
                },
              ],
            },
          },
          scroll: '10m',
        };

        const getMoreUntilDone = async (response: SearchResponse) => {
          if (response?.hits?.hits) {
            const handleIDs = response.hits.hits
                .filter((d) => {
                  if ((d._source as any).handle) return true;
                  return false;
                })
                .map((d) => (d._source as any).handle);
            allRecords = [...allRecords, ...handleIDs];
            if (response.hits.hits.length != 0) {
              const response2: SearchResponse = await this.elasticsearchService
                  .scroll({
                    scroll_id: <string>response._scroll_id,
                    scroll: '10m',
                  })
                  .catch((e) => {
                    this.logger.error(e);
                    return null;
                  });
              if (response2)
                await getMoreUntilDone(response2);
            } else {
              this.elasticsearchService.clearScroll({
                scroll_id: response._scroll_id
              }).catch();
              this.logger.log(allRecords.length + ' handles found in ' + repo);
              resolve(allRecords);
            }
          }
        };

        const response3: SearchResponse = await this.elasticsearchService
          .search(elastic_data)
          .catch((e) => {
            this.logger.error(e);
            return null;
          });

        if (response3) await getMoreUntilDone(response3);
        else resolve(allRecords);
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
      await queue.add(plugin_name, {
        ...data,
        index: `${index_name}_temp`,
      });
    } catch (e) {
      await queue.add(plugin_name, {
        aborted: true,
        aborted_message: 'Failed to initialize plugin',
      });
    }
  }
}
