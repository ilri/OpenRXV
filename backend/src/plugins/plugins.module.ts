import { Module } from '@nestjs/common';
import { DSpaceAltmetrics } from './dspace_altmetrics';
import { MELDownloadsAndViews } from './mel_downloads_and_views';
import { DSpaceDownloadsAndViews } from './dspace_downloads_and_views';
import { DSpaceHealthCheck } from './dspace_health_check';
import { AddMissingItems } from './dspace_add_missing_items';
import { SharedModule } from '../shared/shared.module';
import { DSpaceService } from '../harvesters/DSpace/dspace.service';
import { DSpace7Service } from '../harvesters/DSpace7/dspace7.service';

@Module({
  providers: [
    DSpaceAltmetrics,
    MELDownloadsAndViews,
    DSpaceDownloadsAndViews,
    DSpaceHealthCheck,
    AddMissingItems,
    DSpaceService,
    DSpace7Service,
  ],
  exports: [
    DSpaceAltmetrics,
    MELDownloadsAndViews,
    DSpaceDownloadsAndViews,
    DSpaceHealthCheck,
    AddMissingItems,
  ],
  imports: [SharedModule],
})
export class PluginsModule {}
