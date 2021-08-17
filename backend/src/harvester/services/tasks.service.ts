import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HarvesterService } from './harveter.service';

@Injectable()
export class TasksService {
  constructor(private harvester: HarvesterService) {}
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  handleCron() {
    //this.harvester.startHarvest();
    // this.logger.debug('Called when the current second is 45');
  }
}
