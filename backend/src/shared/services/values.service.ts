import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticService } from './elastic/elastic.service';

@Injectable()
export class ValuesService extends ElasticService {
  index = 'openrxv-values';
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }
}
