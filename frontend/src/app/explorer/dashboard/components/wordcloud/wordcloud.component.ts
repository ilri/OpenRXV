import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import {
  ComponentDashboardConfigs,
  ComponentFilterConfigs,
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
export class WordcloudComponent extends ParentChart implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private settingsService = inject(SettingsService);
  readonly selectService: SelectService;
  readonly store: Store<fromStore.AppState>;
  private readonly bodyBuilderService = inject(BodyBuilderService);

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
  async ngOnInit() {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const sourceString = (source[0] as SourceLevel).field;
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('wordcloud');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      const filters = this.bodyBuilderService
        .getFiltersFromQuery()
        .filter(
          (element) => Object.keys(element).indexOf(sourceString + '.keyword') != -1,
        );
      if (filters.length) this.filterd = true;
      else this.filterd = false;
      if (buckets) {
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  filterd = false;
  resetFilter() {
    this.resetQ();
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
                if (!e.point.destroyed && !e.point.drilldown && this.componentConfigs.allowFilterOnClick) {
                   this.Query(e.point.name);
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
    levelIndex: number
  ): any[] {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const isMultiLevel = Array.isArray(source) && source.length > 1;

    return buckets.map((b: any) => {
      const point: any = {
        name: b.key,
        weight: b.metric ? b.metric.value : b.doc_count,
      };

      if (isMultiLevel) {
        const nextLevelIndex = levelIndex + 1;
        const nextLevelSource = (source as SourceLevel[])[nextLevelIndex];

        if (nextLevelSource) {
          let nextLevelAggName = nextLevelSource.field + '_level_' + nextLevelIndex;
          nextLevelAggName = b[nextLevelAggName] ? nextLevelAggName : (nextLevelSource.field + '.keyword_level_' + nextLevelIndex);
          const subBuckets = b[nextLevelAggName] ? b[nextLevelAggName].buckets : (b.buckets ? b.buckets : null);

          if (subBuckets && subBuckets.length > 0) {
            const drilldownId = `${b.key}_${levelIndex}`;
            point.drilldown = drilldownId;

            drilldownSeries.push({
              id: drilldownId,
              name: b.key,
              type: 'wordcloud',
              data: this.prepareData(subBuckets, drilldownSeries, nextLevelIndex),
            });
          }
        }
      }
      return point;
    });
  }
}
