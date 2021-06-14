import { Module } from '@nestjs/common';
import { DSpaceAltmetrics } from './dspace_altmetrics';
import { HarvesterModule } from 'src/harvester/harvester.module';
import { MELDownloadsAndViews } from './mel_downloads_and_views';
import { DSpaceDownloadsAndViews } from './dspace_downloads_and_views';
import { DSpaceHealthCheck } from './dspace_health_check';
import { AddMissingItems } from './dspace_add_missing_items';
import { SharedModule } from 'src/shared/shared.module';
@Module({
    providers: [DSpaceAltmetrics, MELDownloadsAndViews, DSpaceDownloadsAndViews,DSpaceHealthCheck,AddMissingItems],
    exports: [DSpaceAltmetrics, MELDownloadsAndViews, DSpaceDownloadsAndViews,DSpaceHealthCheck,AddMissingItems],
    imports: [
        SharedModule,
    ],
})
export class PluginsModule { }
