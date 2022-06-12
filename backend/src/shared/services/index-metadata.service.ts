import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticService } from './elastic/elastic.service';

@Injectable()
export class IndexMetadataService extends ElasticService {
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }

  async getMetadata(index) {
    console.log('getMetadata', index);
    const mappings: any = await this.elasticsearchService.indices.getMapping({
      index: index + '_final',
    });
    return Object.keys(mappings.body[index + '_final'].mappings.properties);
  }
}
