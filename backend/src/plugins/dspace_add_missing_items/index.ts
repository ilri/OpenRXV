import { InjectQueue, Processor, Process } from "@nestjs/bull";
import { Logger, HttpService } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { doesNotMatch } from "assert";
import { Queue, Job } from "bull";
import { env } from "process";
import { map } from "rxjs/operators";
import { FormatSearvice } from "../../shared/services/formater.service";
const melnumbersUrl = 'https://mel.cgiar.org/dspace/getdspaceitemsvisits/dspace_item_ids/'

@Processor('plugins')
export class AddMissingItems {
    private logger = new Logger(AddMissingItems.name);


    constructor(
        private http: HttpService,
        public readonly elasticsearchService: ElasticsearchService,
        private formatService: FormatSearvice,
        @InjectQueue('plugins') private pluginQueue: Queue,
    ) { }
    @Process({ name: 'dspace_add_missing_items', concurrency: 5 })
    async transcode(job: Job<any>) {
        await  job.takeLock()
        let url = job.data.itemEndPoint + `/${job.data.handle}?expand=metadata,parentCommunityList,parentCollectionList,bitstreams`;
        let result = await this.http.get(url).pipe(map(d => d.data)).toPromise().catch(d => null);
        job.progress(50);
        if (result && result.type == 'item') {
            this.formatService.Init()
            let formated = this.formatService.format(result, job.data.repo.schema)
            if (job.data.repo.years) {
                let spleted = job.data.repo.years.split(/_(.+)/)

                if (formated[spleted[1]]) {
                    if (typeof formated[spleted[1]] === 'string')
                        formated[job.data.repo.years] = formated[spleted[1]].split("-")[0]
                    if (Array.isArray(formated[spleted[1]]) && typeof formated[spleted[1]][0] === 'string')
                        formated[job.data.repo.years] = formated[spleted[1]][0].split("-")[0]
                }

            }
            formated['id'] = result.uuid ? result.uuid : result.id;
            formated['repo'] = job.data.repo.name;
            job.progress(70);
            await this.elasticsearchService.index({ index: process.env.OPENRXV_TEMP_INDEX, body: formated }).catch(e => job.moveToFailed(e, true))
            this.logger.log("dspace_add_missing_items => " + job.data.handle)
            job.progress(100);
            return 'done';

        }
        return 'done';
    }





}