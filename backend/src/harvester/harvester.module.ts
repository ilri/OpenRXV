import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { HarvesterController } from './harvester/harvester.controller';
import { PluginsConsumer } from './consumers/plugins.consumer';
import { ConfigModule } from '@nestjs/config';
import { DSpaceModule } from 'src/harvesters/DSpace/dspace.module';
import { HarvesterService } from './services/harveter.service';
import { SharedModule } from '../shared/shared.module';
@Module({
  providers: [JsonFilesService, PluginsConsumer, HarvesterService],
  exports: [],
  imports: [
    ConfigModule.forRoot(),
    SharedModule,
    DSpaceModule,
  ],
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
