import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Update } from '@elastic/elasticsearch/api/requestParams';
import { ElasticService } from './elastic/elastic.service';

@Injectable()
export class ValuesService extends ElasticService {
  index: string = 'openrxv-values';
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }
}
