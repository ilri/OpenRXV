import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { SharedModule } from '../../shared/shared.module';
import { DSpace7Service } from './dspace7.service';
@Module({
  providers: [DSpace7Service, JsonFilesService],
  exports: [DSpace7Service],
  imports: [SharedModule],
  controllers: [],
})
export class DSpace7Module {
  constructor(private jsonService: JsonFilesService) {
    this.init();
  }

  async init() {
    setTimeout(async () => {
      await this.jsonService.save(
        {
          name: 'DSpace7',
          api_endpoint: {
            required: true,
            placeholder: 'https://repo.org/server/api'
          },
          sitemap_endpoint: {
            required: true,
            placeholder: 'https://repo.org/sitemap_index.xml'
          },
            start_page: {
            required: false,
            placeholder: '0'
          },
        },
        '../../../data/harvestors/DSpace7.json',
      );
    }, 500);
  }
}
