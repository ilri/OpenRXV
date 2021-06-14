import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { async } from 'rxjs/internal/scheduler/async';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { ValuesService } from 'src/shared/services/values.service';
import Sitemapper from 'sitemapper';
@Injectable()
export class HarvesterService {
    private readonly logger = new Logger(HarvesterService.name);
    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        public readonly jsonFilesService: JsonFilesService,
        public readonly valuesServes: ValuesService,
        @InjectQueue('plugins') private pluginsQueue: Queue,
        @InjectQueue('fetch') private fetchQueue: Queue,
    ) { }
    async getInfoById(id) {

        let job = await this.fetchQueue.getJob(id)
        return job;
    }
    async getInfo() {
        let obj = {
            active_count: 0,
            waiting_count: 0,
            completed_count: 0,
            failed_count: 0,
            plugins_active_count: 0,
            plugins_waiting_count: 0,
            plugins_completed_count: 0,
            plugins_failed_count: 0,
            completed: [],
            failed: [],
            plugins_completed: [],
            plugins_failed: []

        }
        obj.active_count = await this.fetchQueue.getActiveCount()
        obj.waiting_count = await this.fetchQueue.getWaitingCount()
        obj.completed_count = await this.fetchQueue.getCompletedCount()
        obj.failed_count = await this.fetchQueue.getFailedCount()
        obj.completed = await this.fetchQueue.getCompleted(0, 10)
        obj.failed = await this.fetchQueue.getFailed(0, 10)

        obj.plugins_active_count = await this.pluginsQueue.getActiveCount()
        obj.plugins_waiting_count = await this.pluginsQueue.getWaitingCount()
        obj.plugins_completed_count = await this.pluginsQueue.getCompletedCount()
        obj.plugins_failed_count = await this.pluginsQueue.getFailedCount()
        obj.plugins_completed = await this.pluginsQueue.getCompleted(0, 10)
        obj.plugins_failed = await this.pluginsQueue.getFailed(0, 10)

        return obj;
    }

    async getMappingValues() {

        let data = await this.valuesServes.find();
        let values = {}
        data.hits.map(d => values[d._source.find] = d._source.replace)
        return values;
    }

    async stopHarvest() {
        this.logger.debug("Stopping Harvest")
        await this.fetchQueue.pause();
        await this.fetchQueue.empty();
        await this.fetchQueue.clean(0, 'wait')
        await this.pluginsQueue.pause();
        await this.pluginsQueue.empty();
        await this.pluginsQueue.clean(0, 'failed')
        await this.pluginsQueue.clean(0, 'wait')
        await this.pluginsQueue.clean(0, 'active')
        await this.pluginsQueue.clean(0, 'delayed')
        await this.pluginsQueue.clean(0, 'completed')
        return await this.fetchQueue.clean(0, 'active')
    }
    async startHarvest() {
        this.logger.debug("Starting Harvest")
        await this.fetchQueue.pause();
        await this.fetchQueue.empty();
        await this.fetchQueue.clean(0, 'failed')
        await this.fetchQueue.clean(0, 'wait')
        await this.fetchQueue.clean(0, 'active')
        await this.fetchQueue.clean(0, 'delayed')
        await this.fetchQueue.clean(0, 'completed')
        await this.fetchQueue.resume();

        let settings = await this.jsonFilesService.read('../../../data/dataToUse.json');

        settings.repositories.forEach(async repo => {

            const Sitemap = new Sitemapper({
                url: repo.siteMap,
                timeout: 15000, // 15 seconds
            });
            try {
                const { sites } = await Sitemap.fetch();
                let itemsCount = sites.length
                let pages = Math.round(itemsCount / 10);
                for (let page_number = 1; page_number <= pages; page_number++) {
                    setTimeout(() => {
                        this.fetchQueue.add('fetch', { page: page_number, repo })
                    }, page_number <= 5 ? page_number * 500 : 0);

                }
            } catch (error) {
                console.log(error);
            }
        });



        return "started";
    }

    async CheckStart() {
        await this.fetchQueue.pause();
        await this.fetchQueue.empty();
        await this.fetchQueue.clean(0, 'wait')
        await this.fetchQueue.clean(0, 'active')
        await this.fetchQueue.clean(0, 'completed')
        await this.fetchQueue.clean(0, 'failed')
        await this.fetchQueue.resume();
        return await this.Reindex();
    }
    async pluginsStart() {
        await this.pluginsQueue.pause();
        await this.pluginsQueue.empty();
        await this.pluginsQueue.clean(0, 'failed')
        await this.pluginsQueue.clean(0, 'wait')
        await this.pluginsQueue.clean(0, 'active')
        await this.pluginsQueue.clean(0, 'delayed')
        await this.pluginsQueue.clean(0, 'completed')
        await this.pluginsQueue.resume();
        let plugins: Array<any> = await this.jsonFilesService.read('../../../data/plugins.json');
        if (plugins.filter(plugin => plugin.value.length > 0).length > 0)
            for (let plugin of plugins) {
                for (let param of plugin.value) {
                    await this.pluginsQueue.add(plugin.name, { ...param, page: 1, index: process.env.OPENRXV_TEMP_INDEX })
                }
            }
    }
    async Reindex() {
        this.logger.debug("reindex function is called")
        await this.elasticsearchService.indices.updateAliases({
            body: {
                actions: [
                    { remove: { index: process.env.OPENRXV_FINAL_INDEX, alias: process.env.OPENRXV_ALIAS } },
                    { add: { index: process.env.OPENRXV_TEMP_INDEX, alias: process.env.OPENRXV_ALIAS } }
                ]
            }
        })

        this.logger.debug("updateAliases final to tmep")

        await this.elasticsearchService.indices.delete({
            index: process.env.OPENRXV_FINAL_INDEX,
            ignore_unavailable: true
        })
        this.logger.debug("delete final")

        await this.elasticsearchService.indices.create({
            index: process.env.OPENRXV_FINAL_INDEX,

        })
        this.logger.debug("create final")

        await this.elasticsearchService.reindex({

            wait_for_completion: true,
            body: {
                "conflicts": "proceed",
                source: {
                    index: process.env.OPENRXV_TEMP_INDEX
                },
                dest: { index: process.env.OPENRXV_FINAL_INDEX }
            }
        }, { requestTimeout: 2000000 }).catch(e => this.logger.log(e))
        this.logger.debug("reindex to final")


        await this.elasticsearchService.indices.updateAliases({
            body: {
                actions: [
                    { remove: { index: process.env.OPENRXV_TEMP_INDEX, alias: process.env.OPENRXV_ALIAS } },
                    { add: { index: process.env.OPENRXV_FINAL_INDEX, alias: process.env.OPENRXV_ALIAS } }
                ]
            }
        })

        this.logger.debug("updateAliases temp to final")

        await this.elasticsearchService.indices.delete({
            index: process.env.OPENRXV_TEMP_INDEX,
            ignore_unavailable: true
        })
        this.logger.debug("delete temp")

        await this.elasticsearchService.indices.create({
            index: process.env.OPENRXV_TEMP_INDEX,
        })

        this.logger.debug("create temp")

        this.logger.debug("Index All Done ");

    }

}