import { Module } from '@nestjs/common';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { SharedModule } from '../../shared/shared.module';
@Module({
  providers: [JsonFilesService],
  exports: [],
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
        { name: 'DSpace7' },
        '../../../data/harvestors/DSpace7.json',
      );
    }, 500);
  }
}
