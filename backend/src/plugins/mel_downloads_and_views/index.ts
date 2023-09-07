import { HttpService, Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Job } from 'bull';
import { map } from 'rxjs/operators';
const melnumbersUrl =
  'https://mel.cgiar.org/dspace/getdspaceitemsvisits';

@Injectable()
export class MELDownloadsAndViews {

  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
  ) {}

  plugin_name = 'mel_downloads_and_views'

  async start(queue, name: string, concurrency: number) {
    queue.process(name, concurrency, async (job: Job<any>) => {
      if (job.data?.aborted) {
        await job.moveToFailed({message: job.data?.aborted_message}, true);
        return 'aborted';
      }

      await job.progress(20);

      const publicationsToUpdate = job.data.ids;
      if (publicationsToUpdate.length > 0) {
        const stats = await this.http
            .post(melnumbersUrl,
                {dspace_item_ids: publicationsToUpdate},
                {headers: {'Content-Type': 'application/json'}, timeout: 120000},
            )
            .pipe(map((d) => d.data))
            .toPromise();
        await job.progress(50);
        const finalData: Array<any> = [];
        if (stats && stats.data && stats.data.length > 0) {
          stats.data.forEach((stat: any) => {
            const dspace_id = publicationsToUpdate.find((p: any) => p == stat.dspace_item_id)._id;
            if (dspace_id) {
              finalData.push({
                update: {
                  _id: dspace_id,
                  _index: job.data.index,
                },
              });
              finalData.push({
                doc: {
                  numbers: {
                    views: parseInt(stat.views),
                    downloads: parseInt(stat.downloads),
                    score: parseInt(stat.views) + parseInt(stat.downloads),
                  },
                },
              });
            }
          });
          await job.progress(80);
          if (finalData.length) {
            await this.elasticsearchService
                .bulk({
                  refresh: 'wait_for',
                  body: finalData,
                })
                .catch(async (err: Error) => {
                  await job.moveToFailed(err, true);
                });
            await job.progress(100);
          } else {
            await job.progress(100);
          }
        } else {
          await job.progress(100);
        }
      } else {
        await job.progress(100);
      }
      return 'done';
    });
  }

  async addJobs(queue, plugin_name, data, index_name: string) {
    if (plugin_name !== this.plugin_name)
      return;

    try {
      const batch: any = await this.elasticsearchService.search({
        index: `${index_name}_temp`,
        scroll: '5m',
        body: {
          size: 100,
          _source: ['id'],
          track_total_hits: true,
          query: {match: {'repo.keyword': data.repo}},
        },
      });
      data.index_name = `${index_name}_temp`;
      const scrollId = batch?.body?._scroll_id;
      let totalPages = Math.ceil((batch?.body?.hits?.total?.value / 100) || 0) - 1;
      this.addJob(queue, plugin_name, data, batch);

      if (scrollId) {
        for (totalPages; totalPages > 0; totalPages--) {
          let nextBatch: any = await this.elasticsearchService.scroll({
            scroll: '5m',
            scroll_id: scrollId,
          })
          this.addJob(queue, plugin_name, data, nextBatch);
        }
      }
    } catch (e) {
      await queue.add(plugin_name, {
        aborted: true,
        aborted_message: 'Failed to initialize plugin',
      });
    }
  }

  addJob(queue, plugin_name, data, batch) {
    const ids = batch?.body?.hits?.hits.map((p: any) => p._source.id);
    if (Array.isArray(ids) && ids.length > 0) {
      data.ids = ids;
      queue.add(plugin_name, data);
    }
  }
}
