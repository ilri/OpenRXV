import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { HarvesterService } from '../../harvester/services/harveter.service';
import { SharedModule } from '../../shared/shared.module';
import { FetchConsumer } from './fetch.consumer';
@Module({
  providers: [FetchConsumer, JsonFilesService, HarvesterService],
  exports: [FetchConsumer],
  imports: [SharedModule],
  controllers: [],
})
export class DSpaceModule {
  constructor(private jsonService: JsonFilesService) {
    this.init();
  }

  async init() {
    setTimeout(async () => {
      await this.jsonService.save(
        { name: 'DSpace' },
        '../../../data/harvestors/DSpace.json',
      );
    }, 500);
  }
}
