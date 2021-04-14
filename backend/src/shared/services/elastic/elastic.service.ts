import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Update } from '@elastic/elasticsearch/api/requestParams';
import { ApiResponse } from '@elastic/elasticsearch';
import * as bcrypt from 'bcrypt';
@Injectable()
export class ElasticService {
    index: string = 'openrxv-users'
    constructor(public readonly elasticsearchService: ElasticsearchService) { }
    async startup() {

        let values_exist: ApiResponse = await this.elasticsearchService.indices.exists({ index: "openrxv-values" })
        let users_exist: ApiResponse = await this.elasticsearchService.indices.exists({ index: "openrxv-users" })
        let shared_exist: ApiResponse = await this.elasticsearchService.indices.exists({ index: "openrxv-shared" })
        let items_final_exist: ApiResponse = await this.elasticsearchService.indices.exists({ index: process.env.OPENRXV_FINAL_INDEX })
        let items_temp_exist: ApiResponse = await this.elasticsearchService.indices.exists({ index: process.env.OPENRXV_TEMP_INDEX })

        if (!items_final_exist.body)
            await this.elasticsearchService.indices.create(({ index: process.env.OPENRXV_FINAL_INDEX }));
        if (!items_temp_exist.body)
            await this.elasticsearchService.indices.create(({ index: process.env.OPENRXV_TEMP_INDEX }));
        if (!shared_exist.body)
            await this.elasticsearchService.indices.create(({ index: "openrxv-shared" }));
        if (!values_exist.body)
            await this.elasticsearchService.indices.create(({ index: "openrxv-values" }));


        await this.elasticsearchService.cluster.putSettings({
            body: {
                "transient": {
                    "cluster.routing.allocation.disk.threshold_enabled": false
                }
            }
        })
        await this.elasticsearchService.indices.putSettings({
            body: {
                "index.blocks.read_only_allow_delete": null
            }
        })

        if (!users_exist.body) {
            let body = {
                name: "admin",
                role: "Admin",
                email: "admin",
                password: 'admin'
            }
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(body.password, salt);
            body.password = hash;
            await this.add(body);
        }



    }
    async search(query, size = 10, scroll: string = null) {
        try {
            let options: any = {
                index: process.env.OPENRXV_ALIAS,
                method: 'POST',
                // size: size,
                // scroll:'10m',
                body: query
            };
            if(scroll) options.scroll = scroll;
            if(size) options.size = size;
            const { body } = await this.elasticsearchService.search(options);
            return body;
        } catch (e) {
            return e
        }
    }

    async add(item) {
        item['created_at'] = new Date();
        let { body } = await this.elasticsearchService.index({
            index: this.index,
            refresh: 'wait_for',
            body: item
        })
        return body;
    }
    async update(id, item) {

        let update: Update = {
            id,
            index: this.index,
            refresh: 'wait_for',
            body: { doc: item }
        }
        return this.elasticsearchService.update(update);
    }

    async delete(id) {
        let { body } = await this.elasticsearchService.delete({
            index: this.index,
            refresh: 'wait_for',
            id
        })

        return body._source;
    }

    async findOne(id) {
        let { body } = await this.elasticsearchService.get({
            index: this.index,

            id
        })

        return body._source;
    }

    async findByTerm(term = '') {
        try {
            let obj
            if (term != '')
                obj = {
                    "multi_match": {
                        "query": term,
                    }
                }
            else
                obj = {
                    match_all: {}
                }
            let { body } = await this.elasticsearchService.search({
                index: this.index,
                method: 'POST',
                from: 0,
                size: 9999,
                body: {
                    "track_total_hits": true,

                    "query": obj,
                    "sort": [
                        {
                            "created_at": {
                                "order": "desc",
                            }
                        }
                    ]
                }
            });
            return body.hits;
        } catch (e) {
            return { "total": { "value": 0, "relation": "eq" }, "max_score": null, "hits": [] }
        }
    }
    async find(obj: Object = null) {
        try {
            if (obj)
                obj = { bool: { filter: { term: obj } } }
            else
                obj = {
                    "match_all": {}
                }

            let { body } = await this.elasticsearchService.search({
                index: this.index,
                from: 0,
                method: "POST",
                size: 9999,
                body: {
                    "track_total_hits": true,
                    "query": obj,
                    "sort": {
                        "created_at": {
                            "order": "desc"
                        }
                    }
                }
            });
            return body.hits;
        } catch (e) {
            return { "total": { "value": 0, "relation": "eq" }, "max_score": null, "hits": [] }
        }
    }



    async get(q: any, scrollId?: string) {
        try {
            let scrollSearch: any;
            if (scrollId) {
                scrollSearch = await this.elasticsearchService.scroll({
                    scroll_id: scrollId,
                    scroll: '10m',
                    method: 'POST'
                });
            } else {
                scrollSearch = await this.elasticsearchService.search({
                    index: process.env.OPENRXV_ALIAS,
                    scroll: '10m',
                    method: 'POST',
                    body: { ...q }
                });
            }
            return scrollSearch;
        } catch (error) {
            throw new Error(error);
        }
    }
}
