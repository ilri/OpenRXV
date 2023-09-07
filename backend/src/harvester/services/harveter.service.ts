import { Injectable, Logger, OnModuleInit, HttpService } from '@nestjs/common';
import * as Bull from 'bull';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { FetchService } from '../../harvesters/DSpace/fetch.service';
import { AddMissingItems } from '../../plugins/dspace_add_missing_items/index';
import { DSpaceAltmetrics } from '../../plugins/dspace_altmetrics/index';
import { DSpaceDownloadsAndViews } from '../../plugins/dspace_downloads_and_views/index';
import { DSpaceHealthCheck } from '../../plugins/dspace_health_check/index';
import { MELDownloadsAndViews } from '../../plugins/mel_downloads_and_views/index';

import Sitemapper from 'sitemapper';

@Injectable()
export class HarvesterService implements OnModuleInit {
  private readonly logger = new Logger(HarvesterService.name);

  timeout;
  constructor(
      public readonly elasticsearchService: ElasticsearchService,
      public readonly jsonFilesService: JsonFilesService,
      private http: HttpService,
      private readonly fetchService: FetchService,
      private readonly addMissingItems: AddMissingItems,
      private readonly dspaceAltmetrics: DSpaceAltmetrics,
      private readonly dspaceDownloadsAndViews: DSpaceDownloadsAndViews,
      private readonly dspaceHealthCheck: DSpaceHealthCheck,
      private readonly melDownloadsAndViews: MELDownloadsAndViews,
  ) {}

  registeredQueues = {}

  async onModuleInit() {
    await this.ReDefineExistingQueues();
  }

  async ReDefineExistingQueues() {
    const indexes = await this.jsonFilesService.read('../../../data/indexes.json');
    indexes.map((index) => {
      this.RegisterQueue(index.name);
    })
  }

  async RegisterQueue(index_name: string) {
    this.registeredQueues[`${index_name}_fetch`] = new Bull(`${index_name}_fetch`, {
      defaultJobOptions: {
        attempts: 10,
      },
      settings: {
        stalledInterval: 2000,
        maxStalledCount: 10,
        retryProcessDelay: 2000,
        drainDelay: 20000,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    });
    await this.fetchService.RegisterProcess(this.registeredQueues[`${index_name}_fetch`], 'DSpace', index_name);

    this.registeredQueues[`${index_name}_plugins`] = new Bull(`${index_name}_plugins`, {
      defaultJobOptions: {
        attempts: 5,
        timeout: 900000,
      },
      settings: {
        lockDuration: 900000,
        maxStalledCount: 0,
        retryProcessDelay: 9000,
        drainDelay: 9000,
      },
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    });
    await this.addMissingItems.start(this.registeredQueues[`${index_name}_plugins`], 'dspace_add_missing_items', index_name, 5);
    await this.dspaceAltmetrics.start(this.registeredQueues[`${index_name}_plugins`], 'dspace_altmetrics', 0);
    await this.dspaceDownloadsAndViews.start(this.registeredQueues[`${index_name}_plugins`], 'dspace_downloads_and_views', 0);
    await this.dspaceHealthCheck.start(this.registeredQueues[`${index_name}_plugins`], 'dspace_health_check', index_name, 0);
    await this.melDownloadsAndViews.start(this.registeredQueues[`${index_name}_plugins`], 'mel_downloads_and_views', 0);
  }

  async getInfoById(index_name: string, id: number) {
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    return indexFetchQueue != null ? await indexFetchQueue.getJob(id) : null;
  }

  async getInfo(index_name: string) {
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    const indexPluginsQueue = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;

    const obj = {
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

    if (indexFetchQueue == null || indexPluginsQueue == null) {
      return obj;
    }

    obj.active_count = await indexFetchQueue.getActiveCount();
    obj.waiting_count = await indexFetchQueue.getWaitingCount();
    obj.completed_count = await indexFetchQueue.getCompletedCount();
    obj.failed_count = await indexFetchQueue.getFailedCount();
    obj.completed = await indexFetchQueue.getCompleted(0, 10);
    obj.failed = await indexFetchQueue.getFailed(0, 10);

    obj.plugins_active_count = await indexPluginsQueue.getActiveCount();
    obj.plugins_waiting_count = await indexPluginsQueue.getWaitingCount();
    obj.plugins_completed_count = await indexPluginsQueue.getCompletedCount();
    obj.plugins_failed_count = await indexPluginsQueue.getFailedCount();
    obj.plugins_completed = await indexPluginsQueue.getCompleted(0, 10);
    obj.plugins_failed = await indexPluginsQueue.getFailed(0, 10);

    return obj;
  }

  async stopHarvest(index_name: string) {
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    if (indexFetchQueue != null) {
      this.logger.debug('Stopping Harvest');
      await indexFetchQueue.pause();
      await indexFetchQueue.empty();
      await indexFetchQueue.clean(0, 'wait');
      await indexFetchQueue.clean(0, 'active');
      await indexFetchQueue.clean(0, 'delayed');
    }

    const indexPluginsQueue = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;
    if (indexPluginsQueue != null) {
      await indexPluginsQueue.pause();
      await indexPluginsQueue.empty();
      await indexPluginsQueue.clean(0, 'wait');
      await indexPluginsQueue.clean(0, 'active');
      await indexPluginsQueue.clean(0, 'delayed');
    }
  }

  async startHarvest(index_name: string) {
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    const settings = await this.jsonFilesService.read('../../../data/dataToUse.json');
    if (indexFetchQueue == null || !settings.hasOwnProperty(index_name)) {
      return 'Not found';
    }

    this.logger.debug('Starting Harvest');
    await indexFetchQueue.pause();
    await indexFetchQueue.empty();
    await indexFetchQueue.clean(0, 'failed');
    await indexFetchQueue.clean(0, 'wait');
    await indexFetchQueue.clean(0, 'active');
    await indexFetchQueue.clean(0, 'delayed');
    await indexFetchQueue.clean(0, 'completed');
    await indexFetchQueue.resume();

    for (const repo of settings[index_name].repositories) {
      repo.index_name = index_name;
      if (repo.type == 'DSpace') {
        const Sitemap = new Sitemapper({
          url: repo.siteMap,
          timeout: 15000, // 15 seconds
        });
        try {
          const {sites} = await Sitemap.fetch();
          const itemsCount = sites.length;
          this.logger.debug('Starting Harvest =>' + itemsCount);
          const pages = Math.round(itemsCount / 10);
          for (let page_number = 1; page_number <= pages; page_number++) {
            setTimeout(() => {
              indexFetchQueue.add('DSpace', {page: page_number, repo});
            }, page_number <= 5 ? page_number * 500 : 0);
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        this.logger.debug('Starting Harvest =>' + repo.type);
        indexFetchQueue.add(repo.type, {repo: repo});
      }
    }

    return 'started';
  }

  async CheckStart(index_name: string) {
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    if (indexFetchQueue == null) {
      return;
    }
    await indexFetchQueue.pause();
    await indexFetchQueue.empty();
    await indexFetchQueue.clean(0, 'wait');
    await indexFetchQueue.clean(0, 'active');
    await indexFetchQueue.clean(0, 'completed');
    await indexFetchQueue.clean(0, 'failed');
    await indexFetchQueue.resume();
    await this.Reindex(index_name);
  }

  async pluginsStart(index_name: string) {
    const indexPluginsQueue = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;
    if (indexPluginsQueue == null) {
      return 'Not found';
    }

    await indexPluginsQueue.pause();
    await indexPluginsQueue.empty();
    await indexPluginsQueue.clean(0, 'failed');
    await indexPluginsQueue.clean(0, 'wait');
    await indexPluginsQueue.clean(0, 'active');
    await indexPluginsQueue.clean(0, 'delayed');
    await indexPluginsQueue.clean(0, 'completed');
    await indexPluginsQueue.resume();
    const plugins = await this.jsonFilesService.read(
        '../../../data/plugins.json',
    );
    const indexPlugins = plugins.hasOwnProperty(index_name) ? plugins[index_name] : [];
    const indexes = await this.jsonFilesService.read(
        '../../../data/indexes.json',
    );

    const target_index = indexes.filter(d =>  d?.to_be_indexed && d?.name === index_name);
    for (const index of target_index) {
      if (indexPlugins.filter((plugin) => plugin.value.length > 0).length > 0) {
        for (const plugin of indexPlugins) {
          for (const param of plugin.value) {
            // await this.dspaceDownloadsAndViews.addJobs(indexPluginsQueue, plugin.name, param, index.name);
            // await this.melDownloadsAndViews.addJobs(indexPluginsQueue, plugin.name, param, index.name);
            // await this.dspaceAltmetrics.addJobs(indexPluginsQueue, plugin.name, param, index.name);
            await this.dspaceHealthCheck.addJobs(indexPluginsQueue, plugin.name, param, index.name);


          }
        }
      }
    }
  }

  async Reindex(index_name: string) {
    this.logger.debug('reindex function is called');
    let indexes = await this.jsonFilesService.read(
        '../../../data/indexes.json',
    );

    for (let index of indexes.filter((d) => d?.to_be_indexed && d?.name === index_name)) {
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
                  dest: {index: `${index.name}_final`},
                },
              },
              {requestTimeout: 2000000},
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
