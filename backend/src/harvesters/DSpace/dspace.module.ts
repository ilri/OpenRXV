import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { SharedModule } from '../../shared/shared.module';
import { FetchService } from './fetch.service';
@Module({
  providers: [FetchService, JsonFilesService],
  exports: [FetchService],
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
