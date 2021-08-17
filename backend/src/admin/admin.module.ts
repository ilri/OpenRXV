import { Module } from '@nestjs/common';
import { MetadataController } from './metadata/metadata.controller';
import { SharedModule } from 'src/shared/shared.module';
import { ValuesController } from './values/values.controller';
import { SettingsController } from './settings/settings.controller';
import { JsonFilesService } from './json-files/json-files.service';
import { HarvesterModule } from 'src/harvester/harvester.module';
import { MulterModule } from '@nestjs/platform-express';
import { join } from 'path';
@Module({
  controllers: [MetadataController, ValuesController, SettingsController],
  imports: [
    SharedModule,
    HarvesterModule,
    MulterModule.register({
      dest: join(__dirname, '../../data/files'),
    }),
  ],
  providers: [JsonFilesService],
})
export class AdminModule {}
