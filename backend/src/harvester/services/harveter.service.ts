import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { async } from 'rxjs/internal/scheduler/async';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { ValuesService } from '../../shared/services/values.service';
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
  ) {}
  async getInfoById(id) {
    let job = await this.fetchQueue.getJob(id);
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
      plugins_failed: [],
    };
    obj.active_count = await this.fetchQueue.getActiveCount();
    obj.waiting_count = await this.fetchQueue.getWaitingCount();
    obj.completed_count = await this.fetchQueue.getCompletedCount();
    obj.failed_count = await this.fetchQueue.getFailedCount();
    obj.completed = await this.fetchQueue.getCompleted(0, 10);
    obj.failed = await this.fetchQueue.getFailed(0, 10);

    obj.plugins_active_count = await this.pluginsQueue.getActiveCount();
    obj.plugins_waiting_count = await this.pluginsQueue.getWaitingCount();
    obj.plugins_completed_count = await this.pluginsQueue.getCompletedCount();
    obj.plugins_failed_count = await this.pluginsQueue.getFailedCount();
    obj.plugins_completed = await this.pluginsQueue.getCompleted(0, 10);
    obj.plugins_failed = await this.pluginsQueue.getFailed(0, 10);

    return obj;
  }

  async getMappingValues() {
    let data = await this.valuesServes.find();
    let values = {};
    data.hits.map((d) => (values[d._source.find] = d._source.replace));
    return values;
  }

  async stopHarvest() {
    this.logger.debug('Stopping Harvest');
    await this.fetchQueue.pause();
    await this.fetchQueue.empty();
    await this.fetchQueue.clean(0, 'wait');
    await this.pluginsQueue.pause();
    await this.pluginsQueue.empty();
    await this.pluginsQueue.clean(0, 'failed');
    await this.pluginsQueue.clean(0, 'wait');
    await this.pluginsQueue.clean(0, 'active');
    await this.pluginsQueue.clean(0, 'delayed');
    await this.pluginsQueue.clean(0, 'completed');
    return await this.fetchQueue.clean(0, 'active');
  }
  async startHarvest() {
    this.logger.debug('Starting Harvest');
    await this.fetchQueue.pause();
    await this.fetchQueue.empty();
    await this.fetchQueue.clean(0, 'failed');
    await this.fetchQueue.clean(0, 'wait');
    await this.fetchQueue.clean(0, 'active');
    await this.fetchQueue.clean(0, 'delayed');
    await this.fetchQueue.clean(0, 'completed');
    await this.fetchQueue.resume();

    let settings = await this.jsonFilesService.read(
      '../../../data/dataToUse.json',
    );

    settings.repositories.forEach(async (repo) => {
      if (repo.type == 'DSpace') {
        const Sitemap = new Sitemapper({
          url: repo.siteMap,
          timeout: 15000, // 15 seconds
        });
        console.log(repo);
        try {
          const { sites } = await Sitemap.fetch();
          let itemsCount = sites.length;
          this.logger.debug('Starting Harvest =>' + itemsCount);
          let pages = Math.round(itemsCount / 10);
          for (let page_number = 1; page_number <= pages; page_number++) {
            setTimeout(
              () => {
                this.fetchQueue.add('DSpace', { page: page_number, repo });
              },
              page_number <= 5 ? page_number * 500 : 0,
            );
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        this.logger.debug('Starting Harvest =>' + repo.type);
        this.fetchQueue.add(repo.type, { repo: repo });
      }
    });

    return 'started';
  }

  async CheckStart() {
    await this.fetchQueue.pause();
    await this.fetchQueue.empty();
    await this.fetchQueue.clean(0, 'wait');
    await this.fetchQueue.clean(0, 'active');
    await this.fetchQueue.clean(0, 'completed');
    await this.fetchQueue.clean(0, 'failed');
    await this.fetchQueue.resume();
    return await this.Reindex();
  }
  async pluginsStart() {
    await this.pluginsQueue.pause();
    await this.pluginsQueue.empty();
    await this.pluginsQueue.clean(0, 'failed');
    await this.pluginsQueue.clean(0, 'wait');
    await this.pluginsQueue.clean(0, 'active');
    await this.pluginsQueue.clean(0, 'delayed');
    await this.pluginsQueue.clean(0, 'completed');
    await this.pluginsQueue.resume();
    let plugins: Array<any> = await this.jsonFilesService.read(
      '../../../data/plugins.json',
    );
    let indexes = await this.jsonFilesService.read(
      '../../../data/indexes.json',
    );

    for (let index of indexes.filter((d) => d?.to_be_indexed)) {
      if (plugins.filter((plugin) => plugin.value.length > 0).length > 0)
        for (let plugin of plugins) {
          for (let param of plugin.value) {
            await this.pluginsQueue.add(plugin.name, {
              ...param,
              page: 1,
              index: `${index.name}_temp`,
            });
          }
        }
    }
  }
  async Reindex() {
    this.logger.debug('reindex function is called');
    let indexes = await this.jsonFilesService.read(
      '../../../data/indexes.json',
    );

    for (let index of indexes.filter((d) => d?.to_be_indexed)) {
      await this.elasticsearchService.indices.updateAliases({
        body: {
          actions: [
            {
              remove: {
                index: `${index.name}_final`,
                alias: index.name,
              },
            },
            {
              add: {
                index: `${index.name}_temp`,
                alias: index.name,
              },
            },
          ],
        },
      });

      this.logger.debug('updateAliases final to temp');

      await this.elasticsearchService.indices.delete({
        index: `${index.name}_final`,
        ignore_unavailable: true,
      });
      this.logger.debug('Delete final');

      await this.elasticsearchService.indices.create({
        index: `${index.name}_final`,
      });
      this.logger.debug('Create final');

      await this.elasticsearchService
        .reindex(
          {
            wait_for_completion: true,
            body: {
              conflicts: 'proceed',
              source: {
                index: `${index.name}_temp`,
              },
              dest: { index: `${index.name}_final` },
            },
          },
          { requestTimeout: 2000000 },
        )
        .catch((e) => this.logger.log(e));
      this.logger.debug('Reindex to final');

      await this.elasticsearchService.indices.updateAliases({
        body: {
          actions: [
            {
              remove: {
                index: `${index.name}_temp`,
                alias: index.name,
              },
            },
            {
              add: {
                index: `${index.name}_final`,
                alias: index.name,
              },
            },
          ],
        },
      });

      this.logger.debug('updateAliases temp to final');

      await this.elasticsearchService.indices.delete({
        index: `${index.name}_temp`,
        ignore_unavailable: true,
      });
      this.logger.debug('Delete temp');

      await this.elasticsearchService.indices.create({
        index: `${index.name}_temp`,
      });

      this.logger.debug('Create temp');

      this.logger.debug('Indexing finished');
    }
  }
}
