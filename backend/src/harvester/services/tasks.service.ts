import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HarvesterService } from './harveter.service';
import { JsonFilesService } from '../../admin/json-files/json-files.service';

@Injectable()
export class TasksService {
  constructor(
      private harvester: HarvesterService,
      private jsonFilesService: JsonFilesService,
  ) {}
  private readonly logger = new Logger('Auto harvester');

  @Cron('0 */1 * * * *')
  async checkAutoIndexing() {
    const now = new Date();

    const indexes = await this.jsonFilesService.read('../../../data/indexes.json');
    const autoHarvest = [];
    indexes.map(index => {
      if (index?.auto_harvest && index.auto_harvest === true) {
        if (now.getHours() === Number(index?.interval_hour) && now.getMinutes() === Number(index?.interval_minute)) {
          if (index?.interval === 'daily') {
            autoHarvest.push(index.name);
          } else if (index?.interval === 'weekly') {
            if (now.getDay() === Number(index?.interval_week_day)) {
              autoHarvest.push(index.name);
            }
          } else if (index?.interval === 'monthly') {
            if (now.getDate() === Number(index?.interval_month_day)) {
              autoHarvest.push(index.name);
            }
          } else if (index?.interval === 'yearly') {
            if (now.getMonth() === Number(index?.interval_month) && now.getDate() === Number(index?.interval_month_day)) {
              autoHarvest.push(index.name);
            }
          }
        }
      }
    });
    autoHarvest.map(index => {
      this.harvester.startHarvest(index, true);
      this.logger.debug(index + ' auto harvesting started');
    });
  }

  @Cron('*/5 * * * * *')
  async drainPendingQueues() {
    const drainPendingQueues = await this.jsonFilesService.read('../../../data/drainPendingQueues.json');
    for (let i = 0; i < drainPendingQueues.length; i++) {
      const drainPendingQueue = drainPendingQueues[i];

      const isQueueFinished = await this.harvester.IsQueueFinished(drainPendingQueue.queue_name);
      if (!isQueueFinished) {
        let dependenciesFinished = true;
        for (const dependency of drainPendingQueue.dependencies) {
          if (!await this.harvester.IsQueueFinished(dependency)) {
            dependenciesFinished = false;
          }
        }

        if (dependenciesFinished) {
          let queue = null;
          if (drainPendingQueue.queue_name !== null && typeof drainPendingQueue.queue_name === 'object') {
            const queueContainerName = Object.keys(drainPendingQueue.queue_name)?.[0] as string;
            const queueName = Object.values(drainPendingQueue.queue_name)?.[0] as string;
            queue = this.harvester.registeredQueues?.[queueContainerName]?.[queueName];
          } else {
            queue = this.harvester.registeredQueues?.[drainPendingQueue.queue_name];
          }
          if (queue) {
            console.log('queue resumed => ', JSON.stringify(drainPendingQueue.queue_name));
            queue.resume();
          } else {
            console.log('queue not found => ', JSON.stringify(drainPendingQueue.queue_name))
          }
        }
      }
    }
  }
}
