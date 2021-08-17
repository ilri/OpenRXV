import { Module, HttpModule } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticService } from './services/elastic/elastic.service';
import { MetadataService } from './services/metadata.service';
import { ValuesService } from './services/values.service';
import { ShareService } from './services/share.service';
import { StartupService } from './services/startup/startup.service';
import { ConfigModule } from '@nestjs/config';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { FormatSearvice } from './services/formater.service';
import { HarvesterService } from '../harvester/services/harveter.service';
import { BullModule } from '@nestjs/bull';

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
    BullModule.registerQueue({
      name: 'fetch',
      defaultJobOptions: {
        attempts: 10,
      },
      settings: {
        stalledInterval: 2000,
        maxStalledCount: 10,
        retryProcessDelay: 2000,
        drainDelay: 20000,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    BullModule.registerQueue({
      name: 'plugins',
      defaultJobOptions: {
        attempts: 5,
        timeout: 900000,
      },
      settings: {
        lockDuration: 900000,
        maxStalledCount: 0,
        retryProcessDelay: 9000,
        drainDelay: 9000,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
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
    FormatSearvice,
    HarvesterService,
  ],

  exports: [
    SharedModule,
    BullModule,
    ElasticsearchModule,
    ElasticService,
    MetadataService,
    ValuesService,
    ShareService,
    HttpModule,
    JsonFilesService,
    FormatSearvice,
    HarvesterService,
  ],
})
export class SharedModule {}
