import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ApiResponse } from '@elastic/elasticsearch';
export declare class ElasticService {
  readonly elasticsearchService: ElasticsearchService;
  index: string;
  constructor(elasticsearchService: ElasticsearchService);
  startup(): Promise<void>;
  search(query: any, size?: number, scroll?: string): Promise<any>;
  add(item: any): Promise<Record<string, any>>;
  update(
    id: any,
    item: any,
  ): Promise<
    ApiResponse<
      Record<string, any>,
      import('@elastic/elasticsearch/lib/Transport').Context
    >
  >;
  delete(id: any): Promise<any>;
  findOne(id: any): Promise<any>;
  findByTerm(term?: string): Promise<any>;
  find(obj?: Object): Promise<any>;
  get(q: any, scrollId?: string): Promise<any>;
}
