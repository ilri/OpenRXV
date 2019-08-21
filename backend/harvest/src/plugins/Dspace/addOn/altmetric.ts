let Client = require('node-rest-client').Client;
import Bull, { Queue } from 'bull'
let client = new Client();
import { Client as elasticsearch, SearchResponse } from 'elasticsearch'
import * as config from '../../../../../config/index.json';
function cnf() {
    return { host: config.elasticsearch.host };
}
const es_client = new elasticsearch(cnf())

class AddOn {
    queueName: string = "addOns";
    queue: Queue;
    constructor() {
        this.queue = new Bull(this.queueName, {
            limiter: {
                max: 100,
                duration: 9000
            },
            settings: {
                retryProcessDelay: 10000
            },
            redis: config.redis
        });
    }
}


export class Altmetric extends AddOn {

    handlesIds: any;
    constructor() {
        super();
    }

    init() {
        this.handlesIds = this.generateCache().then(d => {
            this.queue.add('altmetric_', { page: 1, prefix: "20.500.11766" }).then(() => {
            }).catch(e => console.log(e));
        })
    }

    process() {
        this.queue.process('altmetric_', 1, this.index)
    }

    index = (job: any, done: any) => {
        let prefix = job.data.prefix;
        let page = job.data.page;

        let Allindexing: Array<any> = []
        client.get("https://api.altmetric.com/v1/citations/at?num_results=100&handle_prefix=" + prefix + "&page=" + page, (data: any) => {
            if (data.results) {
                data.results.forEach((element: any) => {
                    let altmetric = {
                        score: element.score,
                        readers: element.readers_count,
                        mentions: element.cited_by_accounts_count
                    }
                    if (this.handlesIds[element.handle]) {
                        Allindexing.push({ update: { _index: config.temp_index, _type: config.index_type, _id: this.handlesIds[element.handle] } });
                        Allindexing.push({ "doc": { altmetric } });
                    }
                });

                es_client.bulk({
                    refresh: 'wait_for',
                    body: Allindexing
                }).then((currentResult: any) => {
                    if (page < Math.ceil(parseInt(data.query.total) / 100))
                        this.queue.add('altmetric_', { page: page + 1, prefix }).then(() => {
                            done(currentResult.items)
                        }).catch(e => console.log(e));

                }).catch((e: any) => {
                    this.queue.add('altmetric_', { page: page + 1, prefix }).then(() => {
                        done(e);
                    }).catch(e => console.log(e));

                })
            }
        });
    }

    generateCache() {
        return new Promise((resolve, reject) => {
            let allRecords: any = [];
            let total = 0;

            let elastic_data = {
                index: config.temp_index,
                type: config.index_type,
                body: {
                    size: 500,
                    _source: ["handle"],
                    query: {
                        "exists": { "field": "handle" }
                    }
                },
                scroll: '10m'
            };

            es_client.search(elastic_data, function getMoreUntilDone(error, response: SearchResponse<any>) {
                if (error == null) {
                    let handleID = response.hits.hits.map((d: any) => {

                        if (d._source.handle) {
                            let obj: any = {};
                            obj[d._source.handle] = d._id
                            return obj
                        }

                    })
                    allRecords = [...allRecords, ...handleID];
                    if (total === 0) {
                        total = response.hits.total;
                    }
                    if (response.hits.total !== allRecords.length) {
                        es_client.scroll({
                            scrollId: <string>response._scroll_id,
                            scroll: '10m'
                        }, getMoreUntilDone);
                    } else {
                        let finalobj: any = {};
                        allRecords.forEach((element: any) => {
                            finalobj[Object.keys(element)[0]] = Object.values(element)[0]
                        });

                        resolve(finalobj)
                    }
                } else {
                    reject(error);
                }
            });
        });
    }

}



let alt = new Altmetric();

alt.init();
alt.process();