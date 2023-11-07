import { Controller, HttpCode, Post, Body, Get, Param } from '@nestjs/common';

import { ShareService } from '../../shared/services/share.service';
import { JsonFilesService } from '../../admin/json-files/json-files.service';

@Controller('share')
export class ShareController {
  constructor(
    private readonly shareservice: ShareService,
    private readonly jsonFilesService: JsonFilesService = null,
  ) {}
  @HttpCode(200)
  @Post('/:dashboard_name')
  async save(
    @Param('dashboard_name') dashboard_name: string = 'DEFAULT_DASHBOARD',
    @Body() query: any,
  ) {
    const dashboard = await this.jsonFilesService.GetDashboard(dashboard_name);
    const index_name = dashboard?.name
      ? `${dashboard.name}-shared`
      : this.shareservice.index;
    return await this.shareservice.saveShare(query, index_name);
  }

  @HttpCode(200)
  @Get('/:dashboard_name')
  async getAll(
    @Param('dashboard_name') dashboard_name: string = 'DEFAULT_DASHBOARD',
  ) {
    const dashboard = await this.jsonFilesService.GetDashboard(dashboard_name);
    const index_name = dashboard?.name
      ? `${dashboard.name}-shared`
      : this.shareservice.index;
    return await this.shareservice.find(null, index_name);
  }
  @HttpCode(200)
  @Get(['/:dashboard_name/:id', '/:id'])
  async get(
    @Param('dashboard_name') dashboard_name: string = 'DEFAULT_DASHBOARD',
    @Param('id') id: string,
  ) {
    const dashboard = await this.jsonFilesService.GetDashboard(dashboard_name);
    const index_name = dashboard?.name
      ? `${dashboard.name}-shared`
      : this.shareservice.index;
    return await this.shareservice.findOne(id, index_name);
  }
}
