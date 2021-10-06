import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticService } from './elastic/elastic.service';
export declare class MetadataService extends ElasticService {
  readonly elasticsearchService: ElasticsearchService;
  index: string;
  constructor(elasticsearchService: ElasticsearchService);
}
