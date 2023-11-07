import { Logger, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  BulkResponse,
  SearchTotalHits,
  SearchResponse,
  SearchHit,
} from '@elastic/elasticsearch/lib/api/types';
import { Job } from 'bull';
import { map } from 'rxjs/operators';
const crypto = require('crypto');

@Injectable()
export class DSpaceAltmetrics {
  private logger = new Logger('DSpaceAltmetrics');
  identifiers: any = null;
  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
  ) {}

  plugin_name = 'dspace_altmetrics';

  async start(queue, name: string, concurrency: number) {
    queue.process(name, concurrency, async (job: Job<any>) => {
      if (job.data.api_version === 'explorer') {
        await this.AltmetricExplorerApi(job);
      } else {
        await this.AltmetricV1Api(job);
      }
    });
  }

  async AltmetricV1Api(job: Job<any>) {
    const page = job.data.page;
    if (page == 1) this.identifiers = null;
    this.identifiers = await this.generateCache(job.data.index);
    const handle_prefix = job.data.handle_prefix;

    await job.progress(20);
    const Allindexing: Array<any> = [];
    const data: any = await lastValueFrom(
      this.http
        .get(
          `https://api.altmetric.com/v1/citations/at?num_results=100&handle_prefix=${handle_prefix}&page=${page}`,
        )
        .pipe(map((data: any) => data.data)),
    );
    if (data.results) {
      data.results.forEach((element: any) => {
        const altmetric = {
          score: element.score, //attributes > altmetric-score
          readers: element.readers_count, //attributes > readers > mendeley
          mentions: element.cited_by_posts_count, //attributes > mentions (values count)
        };

        let itemIds = [];
        if (element?.handles && Array.isArray(element.handles)) {
          for (const handle of element.handles) {
            if (this.identifiers.handle[handle]) {
              itemIds.push(this.identifiers.handle[handle]);
            }
          }
        }
        if (this.identifiers.handle[element.handle]) {
          itemIds.push(this.identifiers.handle[element.handle]);
        }
        if (this.identifiers.doi[element.doi]) {
          itemIds.push(this.identifiers.doi[element.doi]);
        }

        itemIds = itemIds.filter((value, index, array) => {
          return (
            array.indexOf(value) === index && value !== '' && value != null
          );
        });
        if (itemIds.length > 0) {
          for (const itemId of itemIds) {
            Allindexing.push({
              update: {
                _index: job.data.index,
                _id: itemId,
              },
            });
            Allindexing.push({ doc: { altmetric } });
          }
        }
      });
      await job.progress(80);
      if (Allindexing.length) {
        const currentResult: BulkResponse =
          await this.elasticsearchService.bulk({
            refresh: 'wait_for',
            operations: Allindexing,
          });
        await job.progress(100);
        return currentResult;
      } else {
        return 'No Data to add';
      }
    }
  }

  async AltmetricExplorerApi(job: Job<any>) {
    const page = job.data.page;
    if (page == 1) this.identifiers = null;
    this.identifiers = await this.generateCache(job.data.index);
    const handle_prefix = job.data.handle_prefix;

    await job.progress(20);
    const Allindexing: Array<any> = [];

    const params = {
      filter: {
        scope: 'all',
        handle_prefix: handle_prefix,
      },
      page: {
        size: 100,
        number: page,
      },
    };

    const paramsPrepared = this.AltmetricExplorerPrepareParams(
      params,
      job.data.explorer_api_secret,
      job.data.explorer_api_key,
    );
    const data: any = await lastValueFrom(
      this.http
        .get(
          `https://www.altmetric.com/explorer/api/research_outputs?${paramsPrepared}`,
        )
        .pipe(map((d) => d.data)),
    );

    if (data?.data) {
      data.data.forEach((element: any) => {
        if (
          element?.attributes &&
          element.attributes.hasOwnProperty('altmetric-score') &&
          element.attributes['altmetric-score'] > 0
        ) {
          const readers = Object.values(element.attributes?.readers).reduce(
            (partialSum: number, a: number) => partialSum + a,
            0,
          );
          const mentions = Object.values(element.attributes?.mentions).reduce(
            (partialSum: number, a: number) => partialSum + a,
            0,
          );
          const altmetric = {
            score: element.attributes['altmetric-score'],
            readers: readers,
            mentions: mentions,
          };

          let itemIds = [];
          if (
            element.attributes?.identifiers?.handles &&
            Array.isArray(element.attributes.identifiers.handles)
          ) {
            for (const handle of element.attributes.identifiers.handles)
              if (this.identifiers.handle[handle]) {
                itemIds.push(this.identifiers.handle[handle]);
              }
          }

          if (
            element.attributes?.identifiers?.dois &&
            Array.isArray(element.attributes.identifiers.dois)
          ) {
            for (const doi of element.attributes.identifiers.dois)
              if (this.identifiers.doi[doi]) {
                itemIds.push(this.identifiers.doi[doi]);
              }
          }

          itemIds = itemIds.filter((value, index, array) => {
            return array.indexOf(value) === index;
          });
          if (itemIds.length > 0) {
            for (const itemId of itemIds) {
              Allindexing.push({
                update: {
                  _index: job.data.index,
                  _id: itemId,
                },
              });
              Allindexing.push({ doc: { altmetric } });
            }
          }
        }
      });
      await job.progress(80);
      if (Allindexing.length) {
        const currentResult: BulkResponse =
          await this.elasticsearchService.bulk({
            refresh: 'wait_for',
            operations: Allindexing,
          });
        await job.progress(100);
        return currentResult;
      } else {
        return 'No Data to add';
      }
    }
  }

  async generateCache(index) {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.identifiers != null) {
          resolve(this.identifiers);
          return;
        }
        const allRecords: any = {
          handle: [],
          doi: [],
        };
        const elastic_data = {
          index: index,
          body: {
            size: 500,
            _source: ['handle', 'DOI'],
            track_total_hits: true,
            query: {
              bool: {
                filter: {
                  bool: {
                    should: [
                      {
                        exists: {
                          field: 'DOI',
                        },
                      },
                      {
                        exists: {
                          field: 'handle',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
          scroll: '10m',
        };
        const response3: SearchResponse = await this.elasticsearchService
          .search(elastic_data)
          .catch((e) => {
            this.logger.error(e);
            return null;
          });
        const getMoreUntilDone = async (response: SearchResponse) => {
          if (response?.hits?.hits) {
            const handleID = [];
            const DOIs = [];
            response.hits.hits.map((item: SearchHit) => {
              const data = item._source as any;

              if (data?.handle) {
                const obj = {};
                obj[data?.handle] = item._id;
                handleID.push(obj);
              }

              if (data?.DOI) {
                const doiLink = data?.DOI;
                const regex =
                  /.*(\s|(dx\.doi\.org\/)|(doi\.org\/)|(doi:\s*))\/?:?(10\..*)/;
                const match = regex.exec(doiLink);
                if (match && match?.[5]) {
                  const obj = {};
                  obj[match?.[5]] = item._id;
                  DOIs.push(obj);
                }
              }
            });

            allRecords.handle = [...allRecords.handle, ...handleID];
            allRecords.doi = [...allRecords.doi, ...DOIs];
            if (
              (response.hits.total as SearchTotalHits).value !==
              allRecords.handle.length
            ) {
              const response2: SearchResponse = await this.elasticsearchService
                .scroll({
                  scroll_id: <string>response._scroll_id,
                  scroll: '10m',
                })
                .catch((e) => {
                  this.logger.error(e);
                  return null;
                });
              await getMoreUntilDone(response2);
            } else {
              this.elasticsearchService
                .clearScroll({
                  scroll_id: response._scroll_id,
                })
                .catch();
              const handlesObject = {};
              allRecords.handle.forEach((element) => {
                handlesObject[Object.keys(element)[0]] =
                  Object.values(element)[0];
              });
              const DOIsObject = {};
              allRecords.doi.forEach((element) => {
                DOIsObject[Object.keys(element)[0]] = Object.values(element)[0];
              });
              resolve({
                handle: handlesObject,
                doi: DOIsObject,
              });
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
    if (plugin_name !== `${index_name}_plugins_${this.plugin_name}`) return;

    try {
      // If Altmetric explorer API key is provided, use the explorer API
      if (
        data?.explorer_api_key &&
        data.explorer_api_key !== '' &&
        data?.explorer_api_secret &&
        data.explorer_api_secret !== ''
      ) {
        const params = {
          filter: {
            scope: 'all',
            handle_prefix: data.handle_prefix,
          },
          page: {
            size: 1,
            number: 1,
          },
        };
        const paramsPrepared = this.AltmetricExplorerPrepareParams(
          params,
          data.explorer_api_secret,
          data.explorer_api_key,
        );
        const items: any = await lastValueFrom(
          this.http
            .get(
              `https://www.altmetric.com/explorer/api/research_outputs?${paramsPrepared}`,
            )
            .pipe(map((d) => d.data)),
        );
        if (
          items?.meta?.response &&
          items.meta.response.hasOwnProperty('total-results') &&
          items.meta.response['total-results'] > 0
        ) {
          const totalPages = Math.ceil(
            items.meta.response['total-results'] / 100,
          );
          for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
            await queue.add(
              plugin_name,
              {
                ...data,
                page: currentPage,
                index: `${index_name}_temp`,
                api_version: 'explorer',
              },
              {
                priority: 2,
                delay: 200,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
              },
            );
          }
        }
      } else {
        const items: any = await lastValueFrom(
          this.http
            .get(
              `https://api.altmetric.com/v1/citations/at?num_results=1&handle_prefix=${data.handle_prefix}&page=1`,
            )
            .pipe(map((d) => d.data)),
        );
        if (items?.query?.total) {
          const totalPages = Math.ceil(items.query.total / 100);
          for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
            await queue.add(
              plugin_name,
              {
                ...data,
                page: currentPage,
                index: `${index_name}_temp`,
                api_version: 'v1',
              },
              {
                priority: 2,
                delay: 200,
                backoff: {
                  type: 'exponential',
                  delay: 1000,
                },
              },
            );
          }
        }
      }
    } catch (e) {
      await queue.add(
        plugin_name,
        {
          aborted: true,
          aborted_message: 'Failed to initialize plugin',
        },
        {
          attempts: 0,
          priority: 2,
          delay: 200,
        },
      );
    }
  }

  AltmetricExplorerPrepareParams(params, apiSecret, apiKey) {
    const filters = this.AltmetricExplorerPrepareFilters(
      params?.filter ? params.filter : null,
      apiSecret,
    );

    if (params?.page) {
      for (const param in params.page) {
        if (params.page.hasOwnProperty(param)) {
          filters.queryFilters.push(
            encodeURIComponent(`page[${param}]`) +
              '=' +
              encodeURIComponent(params.page[param]),
          );
        }
      }
    }

    const paramsArray = [`key=${apiKey}`];
    if (filters?.digest) {
      paramsArray.push(`digest=${filters.digest}`);
    }
    if (filters.queryFilters.length > 0) {
      paramsArray.push(filters.queryFilters.join('&'));
    }
    return paramsArray.join('&');
  }

  AltmetricExplorerPrepareFilters(filters, apiSecret) {
    const filtersOrdered = Object.keys(filters)
      .sort()
      .reduce((obj, key) => {
        obj[key] = filters[key];
        return obj;
      }, {});
    const queryFilters = [];
    const hmacFilters = [];
    for (const filter in filtersOrdered) {
      if (filtersOrdered.hasOwnProperty(filter)) {
        if (filter !== 'order') {
          hmacFilters.push(filter);
        }

        if (Array.isArray(filtersOrdered[filter])) {
          filtersOrdered[filter].sort().map((value) => {
            encodeURIComponent(`filter[${filter}][]`);
            queryFilters.push(
              encodeURIComponent(`filter[${filter}][]`) +
                '=' +
                encodeURIComponent(value),
            );

            if (filter !== 'order') {
              hmacFilters.push(value);
            }
          });
        } else {
          queryFilters.push(
            encodeURIComponent(`filter[${filter}]`) +
              '=' +
              encodeURIComponent(filtersOrdered[filter]),
          );

          if (filter !== 'order') {
            hmacFilters.push(filtersOrdered[filter]);
          }
        }
      }
    }

    const hmac = crypto.createHmac('sha1', apiSecret);
    hmac.update(hmacFilters.join('|'));
    return {
      queryFilters,
      digest: hmac.digest().toString('hex'),
    };
  }
}
