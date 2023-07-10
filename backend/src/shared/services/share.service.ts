import { Injectable } from '@nestjs/common';
import { ElasticService } from './elastic/elastic.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import * as hash from 'object-hash';
@Injectable()
export class ShareService extends ElasticService {
  index = 'openrxv-shared';
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }

  async saveShare(item) {
    const hashedItem = hash(item);
    const result = await this.find({ 'hashedItem.keyword': hashedItem });
    if (result.total.value == 0) {
      const { body } = await this.elasticsearchService.index({
        index: this.index,
        refresh: 'wait_for',
        body: { created_at: new Date(), hashedItem, attr: item },
      });
      return body;
    } else {
      return result.hits[0];
    }
  }
}
