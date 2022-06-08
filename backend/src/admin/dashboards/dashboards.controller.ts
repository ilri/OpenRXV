import {
  Controller,
  Get,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JsonFilesService } from '../json-files/json-files.service';

@Controller('dashboards')
export class DashboardsController {
  constructor(private jsonfielServoce: JsonFilesService) {}
  @Get('')
  async Read() {
    return await this.jsonfielServoce.read('../../../data/dashboards.json');
  }
  @Get(':name')
  async ReadIndex(@Param('name') name: string) {
    const dashboard = (
      await this.jsonfielServoce.read('../../../data/dashboards.json')
    ).filter((d) => d.name == name)[0];
    if (!dashboard) throw new NotFoundException();
    return dashboard;
  }
}
