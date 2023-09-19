import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Bull from 'bull';
import { Job } from 'bull';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { DSpaceService } from '../../harvesters/DSpace/dspace.service';
import { AddMissingItems } from '../../plugins/dspace_add_missing_items';
import { DSpaceAltmetrics } from '../../plugins/dspace_altmetrics';
import { DSpaceDownloadsAndViews } from '../../plugins/dspace_downloads_and_views';
import { DSpaceHealthCheck } from '../../plugins/dspace_health_check';
import { MELDownloadsAndViews } from '../../plugins/mel_downloads_and_views';

import Sitemapper from 'sitemapper';
import { DSpace7Service } from "../../harvesters/DSpace7/dspace7.service";

@Injectable()
export class HarvesterService implements OnModuleInit {
  private readonly logger = new Logger(HarvesterService.name);

  timeout;
  constructor(
      public readonly elasticsearchService: ElasticsearchService,
      public readonly jsonFilesService: JsonFilesService,
      private readonly dspaceService: DSpaceService,
      private readonly dspace7Service: DSpace7Service,
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
    if (!this.registeredQueues.hasOwnProperty(`${index_name}_fetch`)) {
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
      await this.dspaceService.RegisterProcess(this.registeredQueues[`${index_name}_fetch`], 'DSpace', index_name);
      await this.dspace7Service.RegisterProcess(this.registeredQueues[`${index_name}_fetch`], 'DSpace7', index_name);
    }

    if (!this.registeredQueues.hasOwnProperty(`${index_name}_plugins`)) {
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
  }

  async getInfoById(index_name: string, id: number) {
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    return indexFetchQueue != null ? await indexFetchQueue.getJob(id) : null;
  }

  PaginationStartEnd(pageIndex, pageSize, defaultPageSize, defaultPage, total) {
     pageSize = pageSize > 0 ? pageSize : defaultPageSize;
     pageIndex = pageIndex >= 0 ? pageIndex : defaultPage;

    let end = total - (pageIndex * pageSize) - 1;
    // end cannot exceed the total (last item index)
    end = (end + 1) > total ? (total - 1) : end;
    // end must be equal or greater than ZERO
    end = end < 0 ? 0 : end;
    let start = end - pageSize + 1;
    // start must be equal or greater than ZERO
    start = start < 0 ? 0 : start;

    return {
      start,
      end,
      pageSize,
      pageIndex
    }
  }

  ReduceJobsObject(jobs: Array<Job>){
    return jobs.map((job) => {
      return {
        id: job?.id,
        repository_name: job?.data?.repo?.name,
        plugin_name: job?.name,
        page: job?.data?.page,
        timestamp: job?.timestamp,
        processedOn: job?.processedOn,
        finishedOn: job?.finishedOn,
        attemptsMade: job?.attemptsMade,
        failedReason: job?.failedReason,
        is_stuck: job?.data?.is_stuck,
      };
    });
  }

  async getInfo(index_name: string, section: string, status: string = 'active', pageIndex: number = 0, pageSize: number = 5) {
    const indexQueue = this.registeredQueues.hasOwnProperty(`${index_name}_${section}`) ? this.registeredQueues[`${index_name}_${section}`] : null;

    let records = [];
    const defaultPageSize = 5;
    const defaultPage = 0;

    const obj = {
      active_count: 0,
      waiting_count: 0,
      completed_count: 0,
      failed_count: 0,
      stuck_count: 0,
      startedAt: null,
      table: {
        data: [],
        pageIndex: defaultPage,
        pageSize: defaultPageSize,
        totalPages: 0,
        totalRecords: 0,
      },
    };

    if (indexQueue == null) {
      return obj;
    }

    const firstCompletedJob = await indexQueue.getCompleted(0, 1);
    obj.startedAt = firstCompletedJob.map(job => job.timestamp);
    obj.startedAt = obj.startedAt.length > 0 ? obj.startedAt[0] : null;

    obj.active_count = await indexQueue.getActiveCount();
    const activeJobs = await indexQueue.getActive();
    for (let i = 0; i < activeJobs.length; i++) {
      activeJobs[i].data.isStuck = await activeJobs[i].isStuck();
      if (activeJobs[i].data.isStuck) {
        obj.stuck_count++;
      }
    }
    obj.waiting_count = await indexQueue.getWaitingCount();
    obj.completed_count = await indexQueue.getCompletedCount();
    obj.failed_count = await indexQueue.getFailedCount();

    const tableDataCount = obj.hasOwnProperty(`${status}_count`) ? obj[`${status}_count`] : 0;
    const limits = this.PaginationStartEnd(pageIndex, pageSize, defaultPageSize, defaultPage, tableDataCount);
    if (status === 'active') {
      records = this.ReduceJobsObject(activeJobs.splice(limits.start, limits.end + 1));
    } else if (status === 'waiting') {
      records = this.ReduceJobsObject(await indexQueue.getWaiting(limits.start, limits.end));
    } else if (status === 'completed') {
      records = this.ReduceJobsObject(await indexQueue.getCompleted(limits.start, limits.end));
    } else if (status === 'failed') {
      records = this.ReduceJobsObject(await indexQueue.getFailed(limits.start, limits.end));
    }

    obj.table = {
      data: records.reverse(),
      pageIndex: limits.pageIndex,
      pageSize: limits.pageSize,
      totalPages: tableDataCount > 0 ? Math.ceil(tableDataCount / limits.pageSize) : 0,
      totalRecords: tableDataCount,
    };

    return obj;
  }

  async stopHarvest(index_name: string) {
    await this.ReDefineExistingQueues();
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    if (indexFetchQueue != null) {
      this.logger.debug('Stopping Harvest');
      await indexFetchQueue.pause();
      await indexFetchQueue.empty();
      await indexFetchQueue.clean(0, 'wait');
      await indexFetchQueue.clean(0, 'active');
      await indexFetchQueue.clean(0, 'delayed');
      await indexFetchQueue.clean(0, 'paused');
    }

    const indexPluginsQueue = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;
    if (indexPluginsQueue != null) {
      await indexPluginsQueue.pause();
      await indexPluginsQueue.empty();
      await indexPluginsQueue.clean(0, 'wait');
      await indexPluginsQueue.clean(0, 'active');
      await indexPluginsQueue.clean(0, 'delayed');
      await indexPluginsQueue.clean(0, 'paused');
    }

    return {
      success: true,
      message: 'Harvest stopped successfully'
    }
  }

  async startHarvest(index_name: string) {
    await this.ReDefineExistingQueues();
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

    const indexPluginsQueue = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;
    if (indexPluginsQueue != null) {
      await indexPluginsQueue.pause();
      await indexPluginsQueue.empty();
      await indexPluginsQueue.clean(0, 'failed');
      await indexPluginsQueue.clean(0, 'wait');
      await indexPluginsQueue.clean(0, 'active');
      await indexPluginsQueue.clean(0, 'delayed');
      await indexPluginsQueue.clean(0, 'completed');
      await indexPluginsQueue.resume();
    }

    if (!await this.IsIndexable(index_name)) {
      return {
        success: false,
        message: 'harvesting is disabled for this index'
      }
    }

    await this.elasticsearchService.indices.delete({
      index: `${index_name}_temp`,
      ignore_unavailable: true,
    });
    this.logger.debug('Delete temp');

    await this.elasticsearchService.indices.create({
      index: `${index_name}_temp`,
    });
    this.logger.debug('Create temp');

    for (const repo of settings[index_name].repositories) {
      repo.index_name = index_name;
      if (repo.type == 'DSpace' || repo.type === 'DSpace7') {
        const Sitemap = new Sitemapper({
          url: repo.siteMap,
          timeout: 15000, // 15 seconds
        });
        try {
          const {sites} = await Sitemap.fetch();
          const itemsCount = sites.length;
          this.logger.debug('Starting Harvest => ' + itemsCount);
          const pages = Math.round(itemsCount / 10);

          let page_number = repo?.startPage && Number(repo.startPage) >= 0 ? Number(repo.startPage) : 0;
          for (page_number; page_number <= pages; page_number++) {
            indexFetchQueue.add(repo.type, {page: page_number, repo});
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        this.logger.debug('Starting Harvest => ' + repo.type);
        indexFetchQueue.add(repo.type, {repo: repo});
      }
    }

    return {
      success: true,
      message: 'Harvesting started successfully'
    }
  }

  async commitIndex(index_name: string) {
    await this.ReDefineExistingQueues();
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

    if (!await this.IsIndexable(index_name)) {
      return {
        success: false,
        message: 'harvesting is disabled for this index'
      }
    }

    await this.Reindex(index_name);

    return {
      success: true,
      message: 'Index committed successfully'
    }
  }

  async pluginsStart(index_name: string) {
    await this.ReDefineExistingQueues();
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

    if (!await this.IsIndexable(index_name)) {
      return {
        success: false,
        message: 'harvesting is disabled for this index'
      }
    }

    if (indexPlugins.filter((plugin) => plugin.value.length > 0).length > 0) {
      for (const plugin of indexPlugins) {
        for (const param of plugin.value) {
          await this.dspaceDownloadsAndViews.addJobs(indexPluginsQueue, plugin.name, param, index_name);
          await this.melDownloadsAndViews.addJobs(indexPluginsQueue, plugin.name, param, index_name);
          await this.dspaceAltmetrics.addJobs(indexPluginsQueue, plugin.name, param, index_name);
          await this.dspaceHealthCheck.addJobs(indexPluginsQueue, plugin.name, param, index_name);
        }
      }
    }

    return {
      success: true,
      message: 'Plugins started successfully'
    }
  }

  async Reindex(index_name: string) {
    this.logger.debug('reindex function is called');
    const indexes: any[] = await this.jsonFilesService.read(
        '../../../data/indexes.json',
    );

    for (const index of indexes) {
      if (index?.to_be_indexed && index?.name === index_name) {
        await this.elasticsearchService.indices.updateAliases({
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

        await this.elasticsearchService.reindex({
              wait_for_completion: true,
              conflicts: 'proceed',
              source: {
                index: `${index.name}_temp`,
              },
              dest: {index: `${index.name}_final`},
            },
            {requestTimeout: 2000000},
        )
            .catch((e) => this.logger.log(e));
        this.logger.debug('Reindex to final');

        await this.elasticsearchService.indices.updateAliases({
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

        index.last_update = new Date().toLocaleString();
      }
    }

    await this.jsonFilesService.save(indexes, '../../../data/indexes.json');
  }

  async IsIndexable(index_name) {
    const indexes = await this.jsonFilesService.read(
        '../../../data/indexes.json',
    );
    const target_index = indexes.filter(d => d?.to_be_indexed && d?.name === index_name);

    return target_index.length > 0
  }
}
