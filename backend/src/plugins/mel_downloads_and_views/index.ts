import { InjectQueue, Processor, Process } from '@nestjs/bull';
import { Logger, HttpService } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Queue, Job } from 'bull';
import { map } from 'rxjs/operators';
import { HarvesterService } from 'src/harvester/services/harveter.service';
const melnumbersUrl =
  'https://mel.cgiar.org/dspace/getdspaceitemsvisits/dspace_item_ids/';

@Processor('plugins')
export class MELDownloadsAndViews {
  private logger = new Logger(MELDownloadsAndViews.name);

  constructor(
    private http: HttpService,
    public readonly elasticsearchService: ElasticsearchService,
    private readonly harvesterService: HarvesterService,
    @InjectQueue('plugins') private pluginQueue: Queue,
  ) {}
  @Process({ name: 'mel_downloads_and_views', concurrency: 1 })
  async transcode(job: Job<any>) {
    job.progress(20);
    let batch;
    let scrollId;
    if (job.data.scroll_id) {
      batch = await this.elasticsearchService.scroll({
        scroll: '5m',
        scroll_id: job.data.scroll_id,
      });
      scrollId = job.data.scroll_id;
    } else {
      batch = await this.elasticsearchService.search({
        index: process.env.OPENRXV_TEMP_INDEX,
        scroll: '5m',
        body: {
          size: 100,
          track_total_hits: true,
          query: { match: { 'repo.keyword': job.data.repo } },
        },
      });
      scrollId = batch.body._scroll_id;
    }
    job.progress(50);

    let publicationsToUpdate = batch.body.hits.hits;
    if (publicationsToUpdate.length > 0) {
      const stats = await this.http
        .get(
          melnumbersUrl +
            publicationsToUpdate.map((p: any) => p._source.id).join(','),
          { headers: { 'Content-Type': 'application/json' }, timeout: 120000 },
        )
        .pipe(map((d) => d.data))
        .toPromise();
      job.progress(70);
      let finaldata: Array<any> = [];
      if (stats && stats.data && stats.data.length > 0) {
        stats.data.forEach((stat: any) => {
          let dspace_id = publicationsToUpdate.find(
            (p: any) => p._source.id == stat.dspace_item_id,
          )._id;
          if (dspace_id) {
            finaldata.push({
              update: {
                _id: dspace_id,
                _index: process.env.OPENRXV_TEMP_INDEX,
              },
            });
            finaldata.push({
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
        job.progress(80);
        let result = await this.elasticsearchService
          .bulk({
            refresh: 'wait_for',
            body: finaldata,
          })
          .catch(async (err: Error) => {
            await this.pluginQueue
              .add('mel_downloads_and_views', {
                scroll_id: scrollId,
                repo: job.data.repo,
              })
              .then(() => {
                job.moveToFailed(err);
              })
              .catch((e) => job.moveToFailed(e));
          });
        job.progress(100);
        let newJob = await this.pluginQueue.add('mel_downloads_and_views', {
          scroll_id: scrollId,
          repo: job.data.repo,
        });
        if (newJob) return result;
      } else {
        await this.pluginQueue
          .add('mel_downloads_and_views', {
            scroll_id: scrollId,
            repo: job.data.repo,
          })
          .then(() => {})
          .catch((e) => job.moveToFailed(e));
      }
    } else {
      job.progress(100);
      return 'all data done';
    }
  }
}
