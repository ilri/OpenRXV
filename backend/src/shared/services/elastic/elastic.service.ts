import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  UpdateRequest,
  IndicesExistsResponse,
  SearchResponse,
  SearchRequest,
  QueryDslQueryContainer,
} from '@elastic/elasticsearch/lib/api/types';
import * as bcrypt from 'bcrypt';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
@Injectable()
export class ElasticService {
  index = 'openrxv-users';
  constructor(
    public readonly elasticsearchService: ElasticsearchService,
    private readonly jsonFilesService: JsonFilesService = null,
  ) {}

  async startUpIndexes(indexes) {
    for (const index of indexes) {
      const items_final_exist: IndicesExistsResponse =
        await this.elasticsearchService.indices
          .exists({
            index: `${index.name}_final`,
          })
          .catch();
      const items_temp_exist: IndicesExistsResponse =
        await this.elasticsearchService.indices
          .exists({
            index: `${index.name}_temp`,
          })
          .catch();

      if (!items_final_exist)
        await this.elasticsearchService.indices
          .create({
            index: `${index.name}_final`,
          })
          .catch();
      if (!items_temp_exist)
        await this.elasticsearchService.indices
          .create({
            index: `${index.name}_temp`,
          })
          .catch();
    }
  }

  async startup() {
    const indexes = await this.jsonFilesService.read(
      '../../../data/indexes.json',
    );

    await this.startUpIndexes(indexes);

    for (const index of indexes) {
      const values_exist: IndicesExistsResponse =
        await this.elasticsearchService.indices
          .exists({
            index: `${index.name}-values`,
          })
          .catch();
      if (!values_exist)
        await this.elasticsearchService.indices
          .create({
            index: `${index.name}-values`,
          })
          .catch();

      const shared_exist: IndicesExistsResponse =
        await this.elasticsearchService.indices
          .exists({
            index: `${index.name}-shared`,
          })
          .catch();
      if (!shared_exist)
        await this.elasticsearchService.indices
          .create({
            index: `${index.name}-shared`,
          })
          .catch();
    }

    await this.elasticsearchService.cluster
      .putSettings({
        transient: {
          'cluster.routing.allocation.disk.threshold_enabled': false,
        },
      })
      .catch();
    await this.elasticsearchService.indices
      .putSettings({
        settings: {
          'index.blocks.read_only_allow_delete': null,
        },
      })
      .catch();

    const users_exist: IndicesExistsResponse =
      await this.elasticsearchService.indices
        .exists({
          index: 'openrxv-users',
        })
        .catch();
    if (!users_exist) {
      const body = {
        name: 'admin',
        role: 'Admin',
        email: 'admin',
        password: 'admin',
      };
      const salt = bcrypt.genSaltSync(10);
      body.password = bcrypt.hashSync(body.password, salt);
      await this.add(body);
    }
  }
  async search(
    query: SearchRequest,
    size = 10,
    scroll: string = null,
    dashboard = 'DEFAULT_DASHBOARD',
  ) {
    const index_name =
      await this.jsonFilesService.getIndexFromDashboard(dashboard);
    try {
      query = await this.addPreDefinedFiltersQuery(query, dashboard);
      const options: SearchRequest = {
        index: index_name,
        ...query,
      };
      if (scroll) options.scroll = scroll;
      if (size) options.size = size;

      return await this.elasticsearchService.search(options);
    } catch (e) {
      return e;
    }
  }

  async add(item, index_name = this.index) {
    item['created_at'] = new Date();
    return await this.elasticsearchService.index({
      index: index_name,
      refresh: 'wait_for',
      document: item,
    });
  }
  async update(id, item, index_name = this.index) {
    const update: UpdateRequest = {
      id,
      index: index_name,
      refresh: 'wait_for',
      doc: item,
    };
    return this.elasticsearchService.update(update);
  }

  async delete(id, index_name = this.index) {
    return await this.elasticsearchService.delete({
      index: index_name,
      refresh: 'wait_for',
      id,
    });
  }

  async findOne(id, index_name = this.index) {
    const body = await this.elasticsearchService.get({
      index: index_name,

      id,
    });

    return body._source;
  }

  async findByTerm(term = '', index_name = this.index) {
    try {
      let obj;
      if (term != '')
        obj = {
          multi_match: {
            query: term,
          },
        };
      else
        obj = {
          match_all: {},
        };
      const response = await this.elasticsearchService.search({
        index: index_name,
        from: 0,
        size: 9999,
        track_total_hits: true,

        query: obj,
        sort: [
          {
            created_at: {
              order: 'desc',
            },
          },
        ],
      });
      return response.hits;
    } catch (e) {
      return { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] };
    }
  }
  async find(obj: object = null, index_name = this.index) {
    try {
      if (obj) obj = { bool: { filter: { term: obj } } };
      else
        obj = {
          match_all: {},
        };

      const response = await this.elasticsearchService.search({
        index: index_name,
        from: 0,
        size: 9999,
        track_total_hits: true,
        query: obj,
        sort: {
          created_at: {
            order: 'desc',
          },
        },
      });
      return response.hits;
    } catch (e) {
      return { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] };
    }
  }

  async get(index_name: string, dashboardName = 'DEFAULT_DASHBOARD', query: SearchRequest, scrollId?: string) {
    try {
      let scrollSearch: SearchResponse;
      if (scrollId) {
        scrollSearch = await this.elasticsearchService.scroll({
          scroll_id: scrollId,
          scroll: '10m',
        });
      } else {
        query = await this.addPreDefinedFiltersQuery(query, dashboardName);
        scrollSearch = await this.elasticsearchService.search({
          index: index_name,
          scroll: '10m',
          ...query,
        });
      }
      return scrollSearch;
    } catch (error) {
      throw new Error(error);
    }
  }

  async addPreDefinedFiltersQuery(query: SearchRequest, dashboardName: string) {
    const predefinedFilters = await this.jsonFilesService.getPredefinedFiltersFromDashboard(dashboardName);
    if (!predefinedFilters || !Array.isArray(predefinedFilters) || predefinedFilters.length === 0) {
      return query;
    }
    const predefinedQuery: QueryDslQueryContainer = {
      bool: {
        filter: {
          bool: {
            must: predefinedFilters,
          }
        }
      }
    };
    if (query?.query) {
      ((predefinedQuery.bool.filter as QueryDslQueryContainer).bool.must as QueryDslQueryContainer[]).push(query?.query);
    }
    query.query = predefinedQuery;

    return query;
  }
}
