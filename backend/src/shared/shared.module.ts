import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticService } from './services/elastic/elastic.service';
import { MetadataService } from './services/metadata.service';
import { ValuesService } from './services/values.service';
import { ShareService } from './services/share.service';
import { StartupService } from './services/startup/startup.service';
import { ConfigModule } from '@nestjs/config';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { FormatService } from './services/formater.service';
import { IndexMetadataService } from './services/index-metadata.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_HOST,
    }),
    HttpModule.register({
      headers: {
        'User-Agent': 'OpenRXV harvesting bot; https://github.com/ilri/OpenRXV',
      },
    }),
  ],
  providers: [
    ElasticService,
    MetadataService,
    ValuesService,
    ShareService,
    StartupService,
    JsonFilesService,
    FormatService,
    IndexMetadataService,
  ],

  exports: [
    SharedModule,
    ElasticsearchModule,
    ElasticService,
    MetadataService,
    ValuesService,
    ShareService,
    HttpModule,
    JsonFilesService,
    FormatService,
    IndexMetadataService,
  ],
})
export class SharedModule {}
