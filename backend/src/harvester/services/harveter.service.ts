import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Bull from 'bull';
import { Job } from 'bull';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { DSpaceService } from '../../harvesters/DSpace/dspace.service';
import { DSpace7Service } from '../../harvesters/DSpace7/dspace7.service';
import { AddMissingItems } from '../../plugins/dspace_add_missing_items';
import { DSpaceAltmetrics } from '../../plugins/dspace_altmetrics';
import { DSpaceDownloadsAndViews } from '../../plugins/dspace_downloads_and_views';
import { MELDownloadsAndViews } from '../../plugins/mel_downloads_and_views';
import * as dayjs from 'dayjs';
import { SearchResponse, SearchRequest, SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';

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
      private readonly melDownloadsAndViews: MELDownloadsAndViews,
  ) {}

  registeredQueues = {}

  async onModuleInit() {
    await this.ClearDrainPendingQueues();
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
      await this.dspaceService.RegisterProcess(this.registeredQueues[`${index_name}_fetch`]);
      await this.dspace7Service.RegisterProcess(this.registeredQueues[`${index_name}_fetch`]);
    }

    if (!this.registeredQueues.hasOwnProperty(`${index_name}_auto_commit`)) {
      this.registeredQueues[`${index_name}_auto_commit`] = new Bull(`${index_name}_auto_commit`, {
        defaultJobOptions: {
          attempts: 10,
          priority: 999,
          delay: 200,
          backoff: {
            type: 'exponential',
            delay: 60000,
          },
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
      await this.RegisterAutoCommitProcess(this.registeredQueues[`${index_name}_auto_commit`], index_name);
      await this.registeredQueues[`${index_name}_auto_commit`].pause();
      await this.RegisterDrainPendingQueues(`${index_name}_auto_commit`, [`${index_name}_fetch`]);
    }

    if (!this.registeredQueues.hasOwnProperty(`${index_name}_plugins`)) {
      this.registeredQueues[`${index_name}_plugins`] = {};
    }

    if (!this.registeredQueues[`${index_name}_plugins`].hasOwnProperty(`dspace_add_missing_items`)) {
      const name = `${index_name}_plugins_dspace_add_missing_items`;
      this.registeredQueues[`${index_name}_plugins`].dspace_add_missing_items = new Bull(name, {
        defaultJobOptions: {
          attempts: 5,
          timeout: 900000,
          removeOnComplete: true,
          removeOnFail: true,
        },
        settings: {
          lockDuration: 900000,
          maxStalledCount: 0,
          retryProcessDelay: 9000,
          drainDelay: 20000,
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      });
      await this.addMissingItems.start(this.registeredQueues[`${index_name}_plugins`].dspace_add_missing_items, name, index_name, 5);
    }

    if (!this.registeredQueues[`${index_name}_plugins`].hasOwnProperty(`dspace_altmetrics`)) {
      const name = `${index_name}_plugins_dspace_altmetrics`;
      this.registeredQueues[`${index_name}_plugins`].dspace_altmetrics = new Bull(name, {
        defaultJobOptions: {
          attempts: 5,
          timeout: 900000,
        },
        settings: {
          lockDuration: 900000,
          maxStalledCount: 0,
          retryProcessDelay: 9000,
          drainDelay: 20000,
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      });
      await this.dspaceAltmetrics.start(this.registeredQueues[`${index_name}_plugins`].dspace_altmetrics, name, 5);
    }

    if (!this.registeredQueues[`${index_name}_plugins`].hasOwnProperty(`dspace_downloads_and_views`)) {
      const name = `${index_name}_plugins_dspace_downloads_and_views`;
      this.registeredQueues[`${index_name}_plugins`].dspace_downloads_and_views = new Bull(name, {
        defaultJobOptions: {
          attempts: 5,
          timeout: 900000,
        },
        settings: {
          lockDuration: 900000,
          maxStalledCount: 0,
          retryProcessDelay: 9000,
          drainDelay: 20000,
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      });
      await this.dspaceDownloadsAndViews.start(this.registeredQueues[`${index_name}_plugins`].dspace_downloads_and_views, name, 5);
    }

    if (!this.registeredQueues[`${index_name}_plugins`].hasOwnProperty(`mel_downloads_and_views`)) {
      const name = `${index_name}_plugins_mel_downloads_and_views`;
      this.registeredQueues[`${index_name}_plugins`].mel_downloads_and_views = new Bull(name, {
        defaultJobOptions: {
          attempts: 5,
          timeout: 900000,
        },
        settings: {
          lockDuration: 900000,
          maxStalledCount: 0,
          retryProcessDelay: 9000,
          drainDelay: 20000,
        },
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      });
      await this.melDownloadsAndViews.start(this.registeredQueues[`${index_name}_plugins`].mel_downloads_and_views, name, 5);
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

  ReduceJobsObject(jobs: Array<Job>) {
    return jobs.map((job) => {
      return {
        id: job?.id,
        repository_name: job?.data?.repo?.name,
        plugin_name: job?.name,
        page: job?.data?.page,
        timestamp: dayjs(job?.timestamp).format('YYYY-MM-DD HH:mm:ss'),
        processedOn: dayjs(job?.processedOn).format('YYYY-MM-DD HH:mm:ss'),
        finishedOn: dayjs(job?.finishedOn).format('YYYY-MM-DD HH:mm:ss'),
        attemptsMade: job?.attemptsMade,
        failedReason: job?.failedReason,
        is_stuck: job?.data?.is_stuck,
      };
    });
  }

  async getInfo(index_name: string, section: string, status: string = 'active', pageIndex: number = 0, pageSize: number = 5) {
    let indexQueue = null;
    if (section === 'fetch') {
      indexQueue = this.registeredQueues.hasOwnProperty(`${index_name}_${section}`) ? this.registeredQueues[`${index_name}_${section}`] : null;
    } else {
      if (this.registeredQueues.hasOwnProperty(`${index_name}_plugins`)) {
        indexQueue = this.registeredQueues[`${index_name}_plugins`].hasOwnProperty(section) ? this.registeredQueues[`${index_name}_plugins`][section] : null;
      }
    }

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
      await indexFetchQueue.resume();
    }
    const autoCommitQueue = this.registeredQueues.hasOwnProperty(`${index_name}_auto_commit`) ? this.registeredQueues[`${index_name}_auto_commit`] : null;
    if (autoCommitQueue != null) {
      this.logger.debug('Stopping auto commit');
      await autoCommitQueue.pause();
      await autoCommitQueue.empty();
      await autoCommitQueue.clean(0, 'wait');
      await autoCommitQueue.clean(0, 'active');
      await autoCommitQueue.clean(0, 'delayed');
      await autoCommitQueue.clean(0, 'paused');
      await autoCommitQueue.pause();
    }

    return {
      success: true,
      message: 'Harvest stopped successfully'
    }
  }

  async stopAll(index_name: string) {
    await this.stopHarvest(index_name);
    await this.pluginsStop(index_name, null);

    return {
      success: true,
      message: 'Harvest and plugins stopped successfully'
    }
  }

  async pluginsStop(index_name: string, plugin_name: string = null) {
    await this.ReDefineExistingQueues();

    const indexPluginsQueues = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;
    if (indexPluginsQueues != null) {
      for (const queueName in indexPluginsQueues) {
        if ((plugin_name == null || plugin_name === queueName) && indexPluginsQueues?.[queueName]) {
          const indexPluginsQueue = indexPluginsQueues[queueName];
          await indexPluginsQueue.pause();
          await indexPluginsQueue.empty();
          await indexPluginsQueue.clean(0, 'wait');
          await indexPluginsQueue.clean(0, 'active');
          await indexPluginsQueue.clean(0, 'delayed');
          await indexPluginsQueue.clean(0, 'paused');
        }
      }
    }

    return {
      success: true,
      message: 'Plugin stopped successfully'
    }
  }

  async startHarvest(index_name: string, autoHarvesting = false) {
    await this.ReDefineExistingQueues();
    const indexFetchQueue = this.registeredQueues.hasOwnProperty(`${index_name}_fetch`) ? this.registeredQueues[`${index_name}_fetch`] : null;
    const settings = await this.jsonFilesService.read('../../../data/dataToUse.json');
    if (indexFetchQueue == null || !settings.hasOwnProperty(index_name)) {
      return 'Not found';
    }

    this.logger.debug('Starting Harvest ' + index_name);
    await indexFetchQueue.pause();
    await indexFetchQueue.empty();
    await indexFetchQueue.clean(0, 'failed');
    await indexFetchQueue.clean(0, 'wait');
    await indexFetchQueue.clean(0, 'active');
    await indexFetchQueue.clean(0, 'delayed');
    await indexFetchQueue.clean(0, 'completed');
    await indexFetchQueue.clean(0, 'paused');
    await indexFetchQueue.resume();

    const autoCommitQueue = this.registeredQueues.hasOwnProperty(`${index_name}_auto_commit`) ? this.registeredQueues[`${index_name}_auto_commit`] : null;
    if (autoCommitQueue != null) {
      await autoCommitQueue.pause();
      await autoCommitQueue.empty();
      await autoCommitQueue.clean(0, 'failed');
      await autoCommitQueue.clean(0, 'wait');
      await autoCommitQueue.clean(0, 'active');
      await autoCommitQueue.clean(0, 'delayed');
      await autoCommitQueue.clean(0, 'completed');
      await autoCommitQueue.clean(0, 'paused');
      await autoCommitQueue.pause();
    }

    const indexPluginsQueues = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;
    if (indexPluginsQueues != null) {
      for (const queueName in indexPluginsQueues) {
        if (indexPluginsQueues?.[queueName]) {
          const indexPluginsQueue = indexPluginsQueues[queueName];
          await indexPluginsQueue.pause();
          await indexPluginsQueue.empty();
          await indexPluginsQueue.clean(0, 'failed');
          await indexPluginsQueue.clean(0, 'wait');
          await indexPluginsQueue.clean(0, 'active');
          await indexPluginsQueue.clean(0, 'delayed');
          await indexPluginsQueue.clean(0, 'completed');
          await indexPluginsQueue.clean(0, 'paused');
          await indexPluginsQueue.resume();
        }
      }
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
    this.logger.debug(`${index_name}: Delete temp`);

    await this.elasticsearchService.indices.create({
      index: `${index_name}_temp`,
    });
    this.logger.debug(`${index_name}: Create temp`);

    for (const repo of settings[index_name].repositories) {
      repo.index_name = index_name;

      if (repo.type === 'DSpace') {
        await this.dspaceService.addJobs(indexFetchQueue, repo);
      } else if (repo.type === 'DSpace7') {
        await this.dspace7Service.addJobs(indexFetchQueue, repo);
      } else {
        this.logger.debug(`${index_name}: Starting Harvest => ${repo.type}`);
        indexFetchQueue.add(repo.type, {repo: repo});
      }
    }

    if (autoHarvesting) {
      const autoCommitQueue = this.registeredQueues.hasOwnProperty(`${index_name}_auto_commit`) ? this.registeredQueues[`${index_name}_auto_commit`] : null;
      if (autoCommitQueue) {
        autoCommitQueue.add(`${index_name}: Auto commit start`, {index_name});
        autoCommitQueue.pause();
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

    if (!await this.IsQueueFinished(`${index_name}_fetch`)) {
      return {
        success: false,
        message: 'Harvesting still in progress'
      }
    }

    if (!await this.IsIndexable(index_name)) {
      return {
        success: false,
        message: 'harvesting is disabled for this index'
      }
    }

    const response = await this.Reindex(index_name);

    return {
      success: response.success,
      message: response.message,
    }
  }

  async pluginsStart(index_name: string, plugin_name: string = null) {
    await this.ReDefineExistingQueues();
    const indexPluginsQueues = this.registeredQueues.hasOwnProperty(`${index_name}_plugins`) ? this.registeredQueues[`${index_name}_plugins`] : null;
    if (indexPluginsQueues == null) {
      return 'Not found';
    }

    for (const queueName in indexPluginsQueues) {
      if ((plugin_name == null || plugin_name === queueName) && indexPluginsQueues?.[queueName]) {
        const indexPluginsQueue = indexPluginsQueues[queueName];
        await indexPluginsQueue.pause();
        await indexPluginsQueue.empty();
        await indexPluginsQueue.clean(0, 'failed');
        await indexPluginsQueue.clean(0, 'wait');
        await indexPluginsQueue.clean(0, 'active');
        await indexPluginsQueue.clean(0, 'delayed');
        await indexPluginsQueue.clean(0, 'completed');
        await indexPluginsQueue.resume();
      }
    }

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
          const name = `${index_name}_plugins_${plugin.name}`;
          if (plugin_name == null || plugin_name === plugin.name)
            if (plugin.name === 'dspace_add_missing_items' && indexPluginsQueues?.dspace_add_missing_items) {
              await this.addMissingItems.addJobs(indexPluginsQueues.dspace_add_missing_items, name, param, index_name);
            } else if (plugin.name === 'dspace_downloads_and_views' && indexPluginsQueues?.dspace_downloads_and_views) {
              await this.dspaceDownloadsAndViews.addJobs(indexPluginsQueues.dspace_downloads_and_views, name, param, index_name);
            } else if (plugin.name === 'mel_downloads_and_views' && indexPluginsQueues?.mel_downloads_and_views) {
              await this.melDownloadsAndViews.addJobs(indexPluginsQueues.mel_downloads_and_views, name, param, index_name);
            } else if (plugin.name === 'dspace_altmetrics' && indexPluginsQueues?.dspace_altmetrics) {
              await this.dspaceAltmetrics.addJobs(indexPluginsQueues.dspace_altmetrics, name, param, index_name);
            }
        }
      }
    }

    return {
      success: true,
      message: 'Plugin started successfully'
    }
  }

  async Reindex(index_name: string) {
    this.logger.debug('reindex function is called');
    const indexes: any[] = await this.jsonFilesService.read(
        '../../../data/indexes.json',
    );

    for (const index of indexes) {
      if (index?.to_be_indexed && index?.name === index_name) {
        try {
          const options: SearchRequest = {
            index: `${index.name}_temp`,
            size: 0,
            track_total_hits: true,
          };
          const items: SearchResponse = await this.elasticsearchService.search(options);
          const totalHits = items?.hits?.total as SearchTotalHits;
          if (!(totalHits?.value > 0)) {
            return {
              success: false,
              message: 'Index is empty'
            }
          }
        } catch (e) {
          return {
            success: false,
            message: 'Index is not found'
          }
        }

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

        index.last_update = dayjs().format('YYYY-MM-DD HH:mm:ss');
      }
    }

    await this.jsonFilesService.save(indexes, '../../../data/indexes.json');

    return {
      success: true,
      message: 'Index committed successfully'
    }
  }

  async IsIndexable(index_name) {
    const indexes = await this.jsonFilesService.read(
        '../../../data/indexes.json',
    );
    const target_index = indexes.filter(d => d?.to_be_indexed && d?.name === index_name);

    return target_index.length > 0
  }

  async RegisterAutoCommitProcess(queue, index_name) {
    queue.process(`${index_name}: Auto commit start`, 1, async (job: Job<any>) => {
      console.log('Auto commit => ', job.data.index_name)
      await job.takeLock();
      const queueDependenciesFinished = await this.QueueDependenciesFinished(`${job.data.index_name}_auto_commit`);
      if (!queueDependenciesFinished) {
        await job.moveToFailed({message: 'Plugins in progress'}, true);
      } else {
        const response: any = await this.commitIndex(job.data.index_name);
        if (response?.success && response.success === true) {
          await job.progress(100);
        } else {
          await job.moveToFailed({message: response?.message ? response.message : 'Oops! something went wrong'}, true);
        }
      }
    });
  }

  async IsQueueEmpty(queue_name) {
    let queue = null;
    if (typeof queue_name === 'string') {
      queue = this.registeredQueues.hasOwnProperty(queue_name) ? this.registeredQueues[queue_name] : null;
    } else if (queue_name && typeof queue_name === 'object') {
      const queueContainerName = Object.keys(queue_name)?.[0] as string;
      const queueName = Object.values(queue_name)?.[0] as string;
      if (queueContainerName && queueName) {
        if (this.registeredQueues?.[queueContainerName]?.[queueName]) {
          queue = this.registeredQueues[queueContainerName][queueName];
        }
      }
    }
    if (!queue) {
      return true;
    }

    let jobsCount = 0;
    Object.values(await queue.getJobCounts()).map((count: number) => {
      jobsCount += count;
    });
    if (jobsCount === 0) {
      return false;
    }
  }

  async IsQueueFinished(queue_name) {
    let queue = null;
    if (typeof queue_name === 'string') {
      queue = this.registeredQueues.hasOwnProperty(queue_name) ? this.registeredQueues[queue_name] : null;
    } else if (queue_name && typeof queue_name === 'object') {
      const queueContainerName = Object.keys(queue_name)?.[0] as string;
      const queueName = Object.values(queue_name)?.[0] as string;
      if (queueContainerName && queueName) {
        if (this.registeredQueues?.[queueContainerName]?.[queueName]) {
          queue = this.registeredQueues[queueContainerName][queueName];
        }
      }
    }
    if (!queue) {
      return true;
    }

    const activeCount = await queue.getActiveCount();
    if (activeCount > 0) {
      return false;
    }

    const waitingCount = await queue.getWaitingCount();
    if (waitingCount > 0) {
      return false;
    }

    const delayedCount = await queue.getDelayedCount();
    if (delayedCount > 0) {
      return false;
    }

    const pausedCount = await queue.getPausedCount();
    if (pausedCount > 0) {
      return false;
    }

    let stuckCount = 0;
    const activeJobs = await queue.getActive();
    for (let i = 0; i < activeJobs.length; i++) {
      activeJobs[i].data.isStuck = await activeJobs[i].isStuck();
      if (activeJobs[i].data.isStuck) {
        stuckCount++;
      }
    }
    if (stuckCount > 0) {
      return false;
    }

    return true;
  }

  async RegisterDrainPendingQueues(queue_name: any, dependencies: any) {
    const drainPendingQueues = await this.jsonFilesService.read('../../../data/drainPendingQueues.json')
        .catch(e => []);
    drainPendingQueues.push({
      queue_name,
      dependencies
    });
    await this.jsonFilesService.save(drainPendingQueues, '../../../data/drainPendingQueues.json');
  }

  async ClearDrainPendingQueues() {
    await this.jsonFilesService.save([], '../../../data/drainPendingQueues.json');
  }

  async QueueDependenciesFinished(queue_name) {
    let queueContainerName = null;
    let queueName = null;
    if (queue_name !== null && typeof queue_name === 'object') {
      queueContainerName = Object.keys(queue_name)?.[0] as string;
      queueName = Object.values(queue_name)?.[0] as string;
    } else {
      queueContainerName = null;
      queueName = queue_name;
    }
    if (!queueName) {
      return false;
    }

    const drainPendingQueues = await this.jsonFilesService.read('../../../data/drainPendingQueues.json');
    const drainPendingQueuesFiltered = drainPendingQueues.filter(drainPendingQueue => {
      let queueContainerNameFiltered = null;
      let queueNameFiltered = null;
      if (drainPendingQueue.queue_name !== null && typeof drainPendingQueue.queue_name === 'object') {
        queueContainerNameFiltered = Object.keys(drainPendingQueue.queue_name)?.[0] as string;
        queueNameFiltered = Object.values(drainPendingQueue.queue_name)?.[0] as string;
      } else {
        queueContainerNameFiltered = null;
        queueNameFiltered = drainPendingQueue.queue_name;
      }
      if (queueContainerNameFiltered === queueContainerName && queueNameFiltered === queueName) {
        return drainPendingQueue;
      }
    });

    for (let i = 0; i < drainPendingQueuesFiltered.length; i++) {
      const drainPendingQueue = drainPendingQueuesFiltered[i];

      const isQueueFinished = await this.IsQueueFinished(drainPendingQueue.queue_name);
      const isQueueEmpty = await this.IsQueueEmpty(drainPendingQueue.queue_name);
      if (!isQueueEmpty && !isQueueFinished) {
        let dependenciesFinished = true;
        for (const dependency of drainPendingQueue.dependencies) {
          if (!await this.IsQueueFinished(dependency)) {
            dependenciesFinished = false;
          }
        }

        return dependenciesFinished;
      }
    }
  }
}
