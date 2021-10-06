import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticService } from './elastic/elastic.service';

@Injectable()
export class IndexMetadataService extends ElasticService {
  index: string = process.env.OPENRXV_FINAL_INDEX;
  constructor(public readonly elasticsearchService: ElasticsearchService) {
    super(elasticsearchService);
  }

  async getMetadata() {
    let mappings: any = await this.elasticsearchService.indices.getMapping({
      index: this.index,
    });
    return Object.keys(mappings.body[this.index].mappings.properties);
  }
}
