import { Module } from '@nestjs/common';

import { BullModule } from '@nestjs/bull';
import { TasksService } from './services/tasks.service';
import { HarvesterService } from './services/harveter.service';
import { FetchConsumer } from './consumers/fetch.consumer';
import { SharedModule } from 'src/shared/shared.module';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { HarvesterController } from './harvester/harvester.controller';
import { PluginsConsumer } from './consumers/plugins.consumer';
import { ConfigModule } from '@nestjs/config';
@Module({
    providers: [TasksService, FetchConsumer, JsonFilesService, PluginsConsumer],
    exports: [],
    imports: [
        ConfigModule.forRoot(),
        SharedModule,
    ],
    controllers: [HarvesterController]
})
export class HarvesterModule {

}
