import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { HarvesterController } from './harvester/harvester.controller';
import { ConfigModule } from '@nestjs/config';
import { DSpaceModule } from 'src/harvesters/DSpace/dspace.module';
import { DSpace7Module } from 'src/harvesters/DSpace7/dspace7.module';
import { HarvesterService } from './services/harveter.service';
import { TasksService } from './services/tasks.service';
import { SharedModule } from '../shared/shared.module';
import { AddMissingItems } from '../plugins/dspace_add_missing_items';
import { DSpaceAltmetrics } from '../plugins/dspace_altmetrics';
import { DSpaceDownloadsAndViews } from '../plugins/dspace_downloads_and_views';
import { MELDownloadsAndViews } from '../plugins/mel_downloads_and_views';

@Module({
  providers: [
    JsonFilesService,
    HarvesterService,
    TasksService,
    AddMissingItems,
    DSpaceAltmetrics,
    DSpaceDownloadsAndViews,
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
