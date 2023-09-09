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

  async saveShare(item, dashboard_name: string) {
    const index_name = dashboard_name === '' || dashboard_name == null ? this.index : `${dashboard_name}-shared`;
    const hashedItem = hash(item);
    const result = await this.find({ 'hashedItem.keyword': hashedItem }, index_name);
    if (result.total.value == 0) {
      const { body } = await this.elasticsearchService.index({
        index: index_name,
        refresh: 'wait_for',
        body: { created_at: new Date(), hashedItem, attr: item },
      });
      return body;
    } else {
      return result.hits[0];
    }
  }
}
