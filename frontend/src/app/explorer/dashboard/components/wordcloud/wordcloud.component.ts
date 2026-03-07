import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
  OnDestroy,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import {
  ComponentDashboardConfigs,
  SourceLevel,
} from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-wordcloud',
  templateUrl: './wordcloud.component.html',
  styleUrls: ['./wordcloud.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class WordcloudComponent
  extends ParentChart
  implements OnInit, OnDestroy
{
  private readonly cdr = inject(ChangeDetectorRef);
  private settingsService = inject(SettingsService);
  readonly selectService: SelectService;
  readonly store: Store<fromStore.AppState>;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const cms = inject(ChartMathodsService);
    const selectService = inject(SelectService);
    const store = inject<Store<fromStore.AppState>>(Store);
    const activatedRoute = inject(ActivatedRoute);

    super(cms, selectService, store, activatedRoute);

    this.selectService = selectService;
    this.store = store;
  }
  colors: string[];
  enabled: boolean;
  filtered: string = '';
  dashboard_name: string;
  async ngOnInit() {
    const dashboard_name =
      this.dashboard_name ??
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('wordcloud');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  resetFilter(filtered: string) {
    this.resetQ(filtered);
    this.filtered = '';
  }
  private setOptions(buckets: Array<Bucket>) {
    const drilldownSeries = [];
    const mainData = this.prepareData(buckets, drilldownSeries, 0);

    this.chartOptions = {
      chart: {
        type: 'wordcloud',
        animation: true,
      },
      boost: {
        enabled: true,
        useGPUTranslations: true,
      },
      colors: this.colors,
      plotOptions: {
        series: {
          point: {
            events: {
              click: (e: any) => {
                if (
                  !e.point.destroyed &&
                  !e.point.drilldown &&
                  this.componentConfigs.allowFilterOnClick
                ) {
                  this.filtered = e.point.source;
                  this.Query(e.point.name, e.point.source);
                }
              },
            },
          },
        },
        wordcloud: {
          tooltip: {
            pointFormat: ' <b>{point.weight}</b>',
            headerFormat: '{point.key}:',
          } as Highcharts.TooltipOptions,
          rotation: 90,
          cursor: 'pointer',
          allowPointSelect: false,
        } as Highcharts.PlotWordcloudOptions,
      },
      series: [
        {
          type: 'wordcloud',
          data: mainData,
          animation: {
            duration: 200,
          },
        } as any,
      ],
      drilldown: {
        series: drilldownSeries as any,
      },
      ...this.cms.commonProperties(),
    };
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }

  private prepareData(
    buckets: any[],
    drilldownSeries: any[],
    levelIndex: number,
  ): any[] {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const isMultiLevel = Array.isArray(source) && source.length > 1;

    return buckets.map((b: any) => {
      const point: any = {
        name: b.key,
        weight: b.metric ? b.metric.value : b.doc_count,
        source: source[levelIndex].field,
      };

      if (isMultiLevel) {
        const nextLevelIndex = levelIndex + 1;
        const nextLevelSource = (source as SourceLevel[])[nextLevelIndex];

        if (nextLevelSource) {
          let nextLevelAggName =
            nextLevelSource.field + '_level_' + nextLevelIndex;
          nextLevelAggName = b[nextLevelAggName]
            ? nextLevelAggName
            : nextLevelSource.field + '.keyword_level_' + nextLevelIndex;
          const subBuckets = b[nextLevelAggName]
            ? b[nextLevelAggName].buckets
            : b.buckets
              ? b.buckets
              : null;

          if (subBuckets && subBuckets.length > 0) {
            const drilldownId = `${b.key}_${levelIndex}`;
            point.drilldown = drilldownId;

            drilldownSeries.push({
              id: drilldownId,
              name: b.key,
              type: 'wordcloud',
              source: nextLevelSource.field,
              data: this.prepareData(
                subBuckets,
                drilldownSeries,
                nextLevelIndex,
              ),
            });
          }
        }
      }
      return point;
    });
  }

  ngOnDestroy(): void {
    this.buildOptions.unsubscribe();
  }
}
