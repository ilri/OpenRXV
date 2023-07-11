import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticService } from './elastic/elastic.service';

@Injectable()
export class MetadataService extends ElasticService {
  index = 'openrxv-metadata';
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }
}
