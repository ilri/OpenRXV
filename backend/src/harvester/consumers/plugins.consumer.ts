import { InjectQueue, Processor, Process, OnGlobalQueueProgress, OnQueueDrained, OnGlobalQueueDrained, OnGlobalQueueResumed } from "@nestjs/bull";
import { Logger, HttpService } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { Queue, Job } from "bull";
import { map } from "rxjs/operators";
import { HarvesterService } from "src/harvester/services/harveter.service";
import { async } from "rxjs/internal/scheduler/async";

@Processor('plugins')
export class PluginsConsumer {
    private logger = new Logger(PluginsConsumer.name);
    handlesIds: any = null;
    constructor(
        private readonly harvesterService: HarvesterService,
    ) { }


    timeout
    @OnGlobalQueueDrained()
    async onDrained(job: Job) {

        if (this.timeout)
            clearTimeout(this.timeout)
        this.timeout = setTimeout(async () => {
            this.logger.log("OnGlobalQueueDrained");
        }, 2000)

    }



}