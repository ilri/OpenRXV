import { Controller, HttpCode, Post, Body, Get, Param } from '@nestjs/common';

import { ShareService } from '../../shared/services/share.service';

@Controller('share')
export class ShareController {
  constructor(private readonly shareservice: ShareService) {}
  @HttpCode(200)
  @Post('/:dashboard_name')
  save(@Param('dashboard_name') dashboard_name: string, @Body() query: any) {
    return this.shareservice.saveShare(query, dashboard_name);
  }

  @HttpCode(200)
  @Get('/:dashboard_name')
  getAll(@Param('dashboard_name') dashboard_name: string) {
    const index_name = dashboard_name === '' || dashboard_name == null ? this.shareservice.index : `${dashboard_name}-shared`;
    return this.shareservice.find(null, index_name);
  }
  @HttpCode(200)
  @Get('/:dashboard_name/:id')
  get(@Param('dashboard_name') dashboard_name: string, @Param('id') id: string) {
    const index_name = dashboard_name === '' || dashboard_name == null ? this.shareservice.index : `${dashboard_name}-shared`;
    return this.shareservice.findOne(id, index_name);
  }
}
