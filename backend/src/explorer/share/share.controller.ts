import { Controller, HttpCode, Post, Body, Get, Param } from '@nestjs/common';

import { ShareService } from 'src/shared/services/share.service';

@Controller('share')
export class ShareController {
  constructor(private readonly shareservice: ShareService) {}
  @HttpCode(200)
  @Post('/')
  save(@Body() query: any) {
    return this.shareservice.saveShare(query);
  }

  @HttpCode(200)
  @Get('/')
  getAll() {
    return this.shareservice.find();
  }
  @HttpCode(200)
  @Get('/:id')
  get(@Param('id') id: string) {
    return this.shareservice.findOne(id);
  }
}
