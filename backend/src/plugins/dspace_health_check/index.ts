import { InjectQueue, Processor, Process, JOB_REF, OnQueueStalled } from "@nestjs/bull";
import { Logger, HttpService } from "@nestjs/common";
import { ElasticsearchService } from "@nestjs/elasticsearch";
import { Queue, Job } from "bull";
import Sitemapper from "sitemapper";
import { JsonFilesService } from "src/admin/json-files/json-files.service";

@Processor('plugins')
export class DSpaceHealthCheck {
    private logger = new Logger(DSpaceHealthCheck.name);
    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        public readonly jsonFilesService: JsonFilesService,
        @InjectQueue('plugins') private pluginsQueue: Queue,
    ) { }
    @Process({ name: 'dspace_health_check', concurrency: 1 })
    async transcode(job: Job<any>) {
        try {
            await job.takeLock()
            this.logger.log('Health Check Started');
            let settings = await this.jsonFilesService.read('../../../data/dataToUse.json');
            let repo = settings.repositories.filter(d => d.name = job.data.repo)[0]
            await job.progress(30);
            const Sitemap = new Sitemapper({
                url: repo.siteMap,
                timeout: 15000, // 15 seconds
            });

            const { sites } = await Sitemap.fetch();
            await job.progress(50);
            let sitemapHandles = sites.map(d => d.split('/handle/')[1])

            let indexedHandles = await this.getHandles(job.data.repo).catch(e => {
                job.moveToFailed(e, true)
                return null;
            });
            await job.progress(80);
            await this.deleteDuplicates(job);
            await this.addjob_missing_items(sitemapHandles.filter(e => !indexedHandles.includes(e)), repo, job, 0);

            this.logger.log('Duplicates Done');
            await job.progress(100);
            return { success: true };
        } catch (e) {
            job.moveToFailed(e, true);
            return { success: false };
        }

    }
    async addjob_missing_items(missingHandles, repo, job, i) {
        if (missingHandles[i]) {
            let handle = missingHandles[i];
            await this.pluginsQueue.add('dspace_add_missing_items', { repo, handle, itemEndPoint: job.data.itemEndPoint }, { attempts: 0 })
            this.addjob_missing_items(missingHandles, repo, job, i + 1)
        }
    }
    async deleteDuplicates(job: Job) {
        let elastic_data = {
            index: process.env.OPENRXV_TEMP_INDEX,
            body: {
                size: 0,
                _source: ["handle"],
                "track_total_hits": true,
                query: {
                    "bool": {
                        "must": [
                            {
                                "match": {
                                    "repo.keyword": job.data.repo
                                }
                            },
                            {
                                "exists": { "field": "handle" }
                            }
                        ]
                    }
                },
                "aggs": {
                    "duplicateCount": {
                        "terms": {
                            "field": "handle.keyword",
                            "min_doc_count": 2,
                            "size": 999
                        },
                        "aggs": {
                            "duplicateDocuments": {
                                "top_hits": {
                                    "size": 100,
                                    "_source": [
                                        "handle"
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        };
        let response: any = await this.elasticsearchService.search(elastic_data).catch((e) => {
            this.logger.error(e)
            job.moveToFailed(e, true);
            return null;
        });

        let duplicates = [];
        if (response) {
            this.logger.log('searching for duplicates')
            response.body.aggregations.duplicateCount.buckets.forEach(async (item) => {
                item.duplicateDocuments.hits.hits.forEach(async (element, index) => {
                    if (item.duplicateDocuments.hits.hits.length - 1 > index) {
                        duplicates.push(element._id);
                        await this.elasticsearchService.delete({ id: element._id, index: process.env.OPENRXV_TEMP_INDEX }).catch(e => this.logger.error(e));

                    }
                });
            })
            if (duplicates.length > 0) {
                setTimeout(() => {
                    this.logger.log(duplicates.length + ' duplicates deleted')
                }, 2000);
                return true
            }
        }

        return false;
    }

    async getHandles(repo): Promise<Array<any>> {
        this.logger.log('getHandles')
        return new Promise(async (resolve, reject) => {
            try {
                let allRecords: any = [];
                let elastic_data = {
                    index: process.env.OPENRXV_TEMP_INDEX,
                    body: {
                        size: 9999,
                        _source: ["handle"],
                        "track_total_hits": true,
                        query: {
                            "bool": {
                                "must": [
                                    {
                                        "match": {
                                            "repo.keyword": repo
                                        }
                                    },
                                    {
                                        "exists": { "field": "handle" }
                                    }
                                ]
                            },

                        }
                    },
                    scroll: '10m'
                };

                let getMoreUntilDone = async (response) => {
                    this.logger.log(allRecords.length + ' handles count')
                    let handleIDs = response.body.hits.hits.filter((d) => {
                        if (d._source.handle)
                            return true;
                        return false;
                    }).map(d => d._source.handle)
                    allRecords = [...allRecords, ...handleIDs];
                    if (response.body.hits.hits.length != 0) {
                        let response2 = await this.elasticsearchService.scroll({
                            scroll_id: <string>response.body._scroll_id,
                            scroll: '10m'
                        }).catch(e => this.logger.error(e));
                        getMoreUntilDone(response2)
                    } else {
                        resolve(allRecords)
                    }
                }

                let response3 = await this.elasticsearchService.search(elastic_data).catch(e => {
                    this.logger.error(e)
                    return null;
                });
                if (response3)
                    getMoreUntilDone(response3)
                else
                    resolve(allRecords)

            } catch (e) {
                this.logger.error(e)
                reject(e);
            }
        });
    }

    @OnQueueStalled()
    OnStalled(job: Job) {
        this.logger.log(
            `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
        );
    }
}