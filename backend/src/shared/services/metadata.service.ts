import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Update } from '@elastic/elasticsearch/api/requestParams';
import { ElasticService } from './elastic/elastic.service';

@Injectable()
export class MetadataService extends ElasticService {
  index: string = 'openrxv-metadata';
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }
}
