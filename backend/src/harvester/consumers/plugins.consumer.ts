import { Processor, OnGlobalQueueDrained } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { HarvesterService } from '../../harvester/services/harveter.service';

@Processor('plugins')
export class PluginsConsumer {
  private logger = new Logger(PluginsConsumer.name);
  handlesIds: any = null;
  constructor(private readonly harvesterService: HarvesterService) {}

  timeout;
  @OnGlobalQueueDrained()
  async onDrained(job: Job) {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(async () => {
      this.logger.log('OnGlobalQueueDrained');
    }, 2000);
  }
}
