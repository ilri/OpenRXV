import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Update } from '@elastic/elasticsearch/api/requestParams';
import { ApiResponse } from '@elastic/elasticsearch';
import * as bcrypt from 'bcrypt';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
@Injectable()
export class ElasticService {
  index = 'openrxv-users';
  constructor(
    public readonly elasticsearchService: ElasticsearchService,
    private readonly jsonFilesService: JsonFilesService = null,
  ) {}

  async startUpIndexes() {
    const indexes = await this.jsonFilesService.read(
      '../../../data/indexes.json',
    );
    for (const index of indexes) {
      const items_final_exist: ApiResponse =
        await this.elasticsearchService.indices.exists({
          index: `${index.name}_final`,
        });
      const items_temp_exist: ApiResponse =
        await this.elasticsearchService.indices.exists({
          index: `${index.name}_temp`,
        });

      if (!items_final_exist.body)
        await this.elasticsearchService.indices.create({
          index: `${index.name}_final`,
        });
      if (!items_temp_exist.body)
        await this.elasticsearchService.indices.create({
          index: `${index.name}_temp`,
        });
    }
  }
  async startup() {
    await this.startUpIndexes();

    const values_exist: ApiResponse =
      await this.elasticsearchService.indices.exists({
        index: 'openrxv-values',
      });
    const users_exist: ApiResponse =
      await this.elasticsearchService.indices.exists({
        index: 'openrxv-users',
      });
    const shared_exist: ApiResponse =
      await this.elasticsearchService.indices.exists({
        index: 'openrxv-shared',
      });

    if (!shared_exist.body)
      await this.elasticsearchService.indices.create({
        index: 'openrxv-shared',
      });
    if (!values_exist.body)
      await this.elasticsearchService.indices.create({
        index: 'openrxv-values',
      });

    await this.elasticsearchService.cluster.putSettings({
      body: {
        transient: {
          'cluster.routing.allocation.disk.threshold_enabled': false,
        },
      },
    });
    await this.elasticsearchService.indices.putSettings({
      body: {
        'index.blocks.read_only_allow_delete': null,
      },
    });

    if (!users_exist.body) {
      const body = {
        name: 'admin',
        role: 'Admin',
        email: 'admin',
        password: 'admin',
      };
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(body.password, salt);
      body.password = hash;
      await this.add(body);
    }
  }
  async search(query, size = 10, scroll: string = null, dashbaord = null) {
    let index_name;

    if (dashbaord == null)
      index_name = await this.jsonFilesService.getIndexFromDashboard('index');
    else
      index_name = await this.jsonFilesService.getIndexFromDashboard(dashbaord);
    try {
      const options: any = {
        index: index_name,
        method: 'POST',
        body: query,
      };
      if (scroll) options.scroll = scroll;
      if (size) options.size = size;

     
      const { body } = await this.elasticsearchService.search(options);
      return body;
    } catch (e) {
      return e;
    }
  }

  async add(item, index_name = this.index) {
    item['created_at'] = new Date();
    const { body } = await this.elasticsearchService.index({
      index: index_name,
      refresh: 'wait_for',
      body: item,
    });
    return body;
  }
  async update(id, item, index_name = this.index) {
    const update: Update = {
      id,
      index: index_name,
      refresh: 'wait_for',
      body: { doc: item },
    };
    return this.elasticsearchService.update(update);
  }

  async delete(id, index_name = this.index) {
    const { body } = await this.elasticsearchService.delete({
      index: index_name,
      refresh: 'wait_for',
      id,
    });

    return body._source;
  }

  async findOne(id, index_name = this.index) {
    const { body } = await this.elasticsearchService.get({
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
      const { body } = await this.elasticsearchService.search({
        index: index_name,
        method: 'POST',
        from: 0,
        size: 9999,
        body: {
          track_total_hits: true,

          query: obj,
          sort: [
            {
              created_at: {
                order: 'desc',
              },
            },
          ],
        },
      });
      return body.hits;
    } catch (e) {
      return { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] };
    }
  }
  async find(obj: Object = null, index_name = this.index) {
    try {
      if (obj) obj = { bool: { filter: { term: obj } } };
      else
        obj = {
          match_all: {},
        };

      const { body } = await this.elasticsearchService.search({
        index: index_name,
        from: 0,
        method: 'POST',
        size: 9999,
        body: {
          track_total_hits: true,
          query: obj,
          sort: {
            created_at: {
              order: 'desc',
            },
          },
        },
      });
      return body.hits;
    } catch (e) {
      return { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] };
    }
  }

  async get(index_name,q: any, scrollId?: string) {
    try {
      let scrollSearch: any;
      if (scrollId) {
        scrollSearch = await this.elasticsearchService.scroll({
          scroll_id: scrollId,
          scroll: '10m',
          method: 'POST',
        });
      } else {
        scrollSearch = await this.elasticsearchService.search({
          index: index_name,
          scroll: '10m',
          method: 'POST',
          body: { ...q },
        });
      }
      return scrollSearch;
    } catch (error) {
      throw new Error(error);
    }
  }
}
