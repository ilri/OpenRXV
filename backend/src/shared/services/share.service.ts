import { Injectable } from '@nestjs/common';
import { ElasticService } from './elastic/elastic.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import * as hash from 'object-hash';
@Injectable()
export class ShareService extends ElasticService {
  index = 'openrxv-shared';
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }

  async saveShare(item, index_name: string) {
    const hashedItem = hash(item);
    const result = await this.find(
      { 'hashedItem.keyword': hashedItem },
      index_name,
    );
    if ((result.total as SearchTotalHits).value == 0) {
      return await this.elasticsearchService.index({
        index: index_name,
        refresh: 'wait_for',
        document: {
          created_at: new Date(),
          hashedItem,
          attr: item.attr,
          operator: item.operator,
        },
      });
    } else {
      return result.hits[0];
    }
  }
}
