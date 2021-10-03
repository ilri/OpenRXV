import { ElasticService } from './elastic/elastic.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';
export declare class ShareService extends ElasticService {
  readonly elasticsearchService: ElasticsearchService;
  index: string;
  constructor(elasticsearchService: ElasticsearchService);
  saveShare(item: any): Promise<any>;
}
