import { Logger, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchRequest, SearchResponse, OpenPointInTimeResponse } from '@elastic/elasticsearch/lib/api/types';
import { Job } from 'bull';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import Sitemapper from 'sitemapper';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';

@Injectable()
export class DSpaceHealthCheck {
  private logger = new Logger('dspace_health_check');
  constructor(
    public readonly elasticsearchService: ElasticsearchService,
    public readonly jsonFilesService: JsonFilesService,
    private http: HttpService,
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
            'User-Agent': 'OpenRXV harvesting bot; https://github.com/ilri/OpenRXV',
          },
        });
        this.logger.log('Getting ' + job.data.repo + ' sitemap ' + repo.siteMap);

        const {sites} = await Sitemap.fetch();
        await job.progress(50);

        repo.index_name = job.data.index;

        let itemsIdentifiers = [];
        let sitemapIdentifiers = [];
        if (job.data?.sitemapIdentifier === 'handle') {
          sitemapIdentifiers = sites.map((d) => d.split('/handle/')[1]);
        } else if (job.data?.sitemapIdentifier === 'uuid') {
          sitemapIdentifiers = sites.map((d) => d.split('/').at(-1));
        } else {
          await job.moveToFailed({message: 'sitemapIdentifier is not defined for the plugin'}, true);
          return {success: false};
        }

        if (repo.type === 'DSpace7') {
          const collectionsCommunitiesIds = await this.getCollectionsCommunitiesIds(repo.itemsEndPoint);

          for (let i = 0; i < collectionsCommunitiesIds.length; i++) {
            const index = sitemapIdentifiers.indexOf(collectionsCommunitiesIds[i]);
            if (index !== -1) {
              sitemapIdentifiers.splice(index,1);
            }
          }
        }
        this.logger.log('Items sitemap identifiers found ' + sitemapIdentifiers.length);


        itemsIdentifiers = await this.getIdentifiers(repo, job.data.sitemapIdentifier).catch((e) => {
          job.moveToFailed(e, true);
          return null;
        });
        await job.progress(80);

        for (let i = 0; i < itemsIdentifiers.length; i++) {
          const index = sitemapIdentifiers.indexOf(itemsIdentifiers[i]);
          if (index !== -1) {
            sitemapIdentifiers.splice(index,1);
          }
        }
        this.logger.log('Missing identifiers found ' + sitemapIdentifiers.length);

        for (let i = 0; i < sitemapIdentifiers.length; i++) {
          await queue.add('dspace_add_missing_items', {
            index: job.data.index,
            repo,
            sitemapIdentifier: job.data.sitemapIdentifier,
            identifier: sitemapIdentifiers[i],
            itemEndPoint: job.data.itemEndPoint
          }, {
            attempts: 0
          });
        }
        this.logger.log(
            'Missing identifiers for ' + job.data.repo + ' added to the Queue',
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

  async deleteDuplicates(job: Job, sitemapIdentifier) {
    const elastic_data: SearchRequest = {
      index: job.data.index,
      size: 0,
      _source: [sitemapIdentifier],
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
              exists: { field: sitemapIdentifier },
            },
          ],
        },
      },
      aggs: {
        duplicateCount: {
          terms: {
            field: `${sitemapIdentifier}.keyword`,
            min_doc_count: 2,
            size: 999,
          },
          aggs: {
            duplicateDocuments: {
              top_hits: {
                size: 100,
                _source: [sitemapIdentifier],
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
      this.logger.log('Searching for duplicate identifiers for ' + job.data.repo);
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
              ' duplicate identifiers deleted in ' +
              job.data.repo,
          );
        }, 2000);
        return true;
      }
    }

    return false;
  }

  async getIdentifiers(repo, sitemapIdentifier): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {

        const openPointInTime: OpenPointInTimeResponse = await this.elasticsearchService.openPointInTime({
          index: repo.index_name,
          keep_alive: '5m',
        }).catch(() => {
          return null;
        });

        const elastic_data: SearchRequest = {
          size: 9999,
          _source: [sitemapIdentifier],
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
                  exists: {field: sitemapIdentifier},
                },
              ],
            },
          },
          sort: [{'uuid.keyword': 'asc'}],
        };

        if (openPointInTime?.id) {
          elastic_data.pit = {
            id: openPointInTime.id,
            keep_alive: '5m'
          }
        }

        const allRecords = [];

        const getMoreUntilDone = async () => {
          const response: SearchResponse = await this.elasticsearchService
              .search(elastic_data)
              .catch((e) => {
                this.logger.error(e);
                return null;
              });

          if (response?.hits?.hits.length > 0) {
            response.hits.hits
                .map((d) => {
                  const identifier = (d._source as any)[sitemapIdentifier];
                  if (identifier)
                    allRecords.push(identifier);
                });

            elastic_data.search_after = response.hits.hits.at(-1).sort;

            await getMoreUntilDone();
          }
        };

        await getMoreUntilDone();

        if (openPointInTime?.id) {
          await this.elasticsearchService.closePointInTime({
            id: openPointInTime.id,
          }).catch(() => {
            return null;
          });
        }

        resolve(allRecords);
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

  async getCollectionsCommunitiesIds(endPoint) {
    // Remove the "/" from the end of the endPoint
    endPoint = endPoint.replace(/\/$/gm, '');

    const uuids = [];
    const communitiesRequest = await lastValueFrom(
        this.http.get(`${endPoint}/discover/search/objects?dsoType=community&size=1&page=0`)
    ).catch(() => {
      return null;
    });
    if (communitiesRequest?.data?._embedded?.searchResult?.page?.totalElements && communitiesRequest.data._embedded.searchResult.page.totalElements > 0) {
      const totalPages = Math.ceil(communitiesRequest.data._embedded.searchResult.page.totalElements / 100);
      for (let page = 0; page < totalPages; page++) {
        const data = await lastValueFrom(
            this.http.get(`${endPoint}/discover/search/objects?dsoType=community&size=100&page=${page}`)
        ).catch(() => {
          return null;
        });
        const communities = data?.data?._embedded?.searchResult?._embedded?.objects;
        if (communities) {
          communities.map((communityObject) => {
            const uuid = communityObject?._embedded?.indexableObject?.uuid;
            if (uuid) {
              uuids.push(uuid);
            }
          });
        }
      }
    }

    const collectionsRequest = await lastValueFrom(
        this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&size=1&page=0`)
    ).catch(() => {
      return null;
    });

    if (collectionsRequest?.data?._embedded?.searchResult?.page?.totalElements && collectionsRequest.data._embedded.searchResult.page.totalElements > 0) {
      const totalPages = Math.ceil(collectionsRequest.data._embedded.searchResult.page.totalElements / 100);
      for (let page = 0; page < totalPages; page++) {
        const data = await lastValueFrom(
            this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&size=100&page=${page}`)
        ).catch(() => {
          return null;
        });
        const collections = data?.data?._embedded?.searchResult?._embedded?.objects;
        if (collections) {
          collections.map((collectionObject) => {
            const uuid = collectionObject?._embedded?.indexableObject?.uuid;
            if (uuid) {
              uuids.push(uuid);
            }
          });
        }
      }
    }

    return uuids;
  }
}
