import {Controller, UseGuards, Get, Post, Param, Query} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HarvesterService } from '../services/harveter.service';

@Controller('harvester')
export class HarvesterController {
  constructor(private harvestService: HarvesterService) {}
  @UseGuards(AuthGuard('jwt'))
  @Get('info/:index_name')
  async getInfo(
      @Param('index_name') index_name: string,
      @Query('section') section: string,
      @Query('status') status: string,
      @Query('pageIndex') pageIndex: number,
      @Query('pageSize') pageSize: number,
  ) {
    return await this.harvestService.getInfo(index_name, section, status, pageIndex, pageSize);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('info/:index_name/:id')
  async getInfoByID(@Param('index_name') index_name: string, @Param('id') job_id: number) {
    return await this.harvestService.getInfoById(index_name, job_id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('startindex/:index_name')
  async StartIndex(@Param('index_name') index_name: string) {
    return { message: Date(), start: await this.harvestService.startHarvest(index_name) };
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('stopindex/:index_name')
  async StopIndex(@Param('index_name') index_name: string) {
    return { message: Date(), start: await this.harvestService.stopHarvest(index_name) };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('start-plugins/:index_name')
  async pluginsStart(@Param('index_name') index_name: string) {
    return { message: Date(), start: await this.harvestService.pluginsStart(index_name) };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('start-reindex/:index_name')
  async CheckStart(@Param('index_name') index_name: string) {
    return { message: Date(), start: await this.harvestService.CheckStart(index_name) };
  }
}
