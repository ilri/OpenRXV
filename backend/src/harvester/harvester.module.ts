import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { HarvesterController } from './harvester/harvester.controller';
import { ConfigModule } from '@nestjs/config';
import { DSpaceModule } from 'src/harvesters/DSpace/dspace.module';
import { DSpace7Module } from 'src/harvesters/DSpace7/dspace7.module';
import { HarvesterService } from './services/harveter.service';
import { SharedModule } from '../shared/shared.module';
import { AddMissingItems } from '../plugins/dspace_add_missing_items/index';
import { DSpaceAltmetrics } from '../plugins/dspace_altmetrics/index';
import { DSpaceDownloadsAndViews } from '../plugins/dspace_downloads_and_views/index';
import { DSpaceHealthCheck } from '../plugins/dspace_health_check/index';
import { MELDownloadsAndViews } from '../plugins/mel_downloads_and_views/index';

@Module({
  providers: [
    JsonFilesService,
    HarvesterService,
    AddMissingItems,
    DSpaceAltmetrics,
    DSpaceDownloadsAndViews,
    DSpaceHealthCheck,
    MELDownloadsAndViews,
  ],
  exports: [],
  imports: [ConfigModule.forRoot(), SharedModule, DSpaceModule, DSpace7Module],
  controllers: [HarvesterController],
})
export class HarvesterModule {
  constructor(private jsonService: JsonFilesService) {
    this.init();
  }
  async init() {
    await this.jsonService.createifnotexist();
  }
}
