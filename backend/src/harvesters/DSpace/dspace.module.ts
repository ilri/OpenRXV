import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { SharedModule } from '../../shared/shared.module';
import { DSpaceService } from './dspace.service';
@Module({
  providers: [DSpaceService, JsonFilesService],
  exports: [DSpaceService],
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
        {
          name: 'DSpace',
          api_endpoint: {
            required: true,
            placeholder: 'https://repo.org/rest',
          },
          sitemap_endpoint: {
            required: true,
            placeholder: 'https://repo.org/sitemap',
            sitemap_identifier: 'handle',
          },
          start_page: {
            required: false,
            placeholder: '0',
          },
        },
        '../../../data/harvestors/DSpace.json',
      );
    }, 500);
  }
}
