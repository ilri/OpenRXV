import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { ParentChart } from '../parent-chart';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { BarService } from './services/bar/bar.service';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';
import {ComponentDashboardConfigs} from "../../../configs/generalConfig.interface";

@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
  providers: [ChartMathodsService, RangeService, BarService, SelectService],
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [ChartComponent],
})
export class BarComponent extends ParentChart implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private settingsService = inject(SettingsService);
  readonly selectService: SelectService;
  readonly store: Store<fromStore.AppState>;

  enabled: boolean;

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
  items_label = 'Information Products';
  filtered: string = '';
  async ngOnInit() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.items_label = appearance.items_label;
    this.init('column');
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
  setOptions(buckets: Array<Bucket>) {
    const { source, direction, stacking } = this.componentConfigs as ComponentDashboardConfigs;
    const isMultiLevel = Array.isArray(source) && source.length > 1;

    const chartType = direction === 'horizontal' ? 'bar' : 'column';
    const isStacked = stacking === 'stack';
    const isPlain = stacking === 'plain';

    let series = [];
    const drilldownSeries = [];

    if (isMultiLevel && !isPlain) {
      // Level 1: Categories
      // Level 2: Series (Groups)
      // Level 3+: Drilldown
      const seriesNames = new Set<string>();

      buckets.forEach((b: any) => {
        const nextLevelSource = source[1];
        let nextLevelAggName = nextLevelSource.field + '_level_1';
        nextLevelAggName = b[nextLevelAggName] ? nextLevelAggName : (nextLevelSource.field + '.keyword_level_1');
        const subBuckets = b[nextLevelAggName] ? b[nextLevelAggName].buckets : (b.buckets ? b.buckets : []);

        subBuckets.forEach(sb => {
          seriesNames.add(sb.key);
        });
      });

      series = Array.from(seriesNames).map(name => {
        const data = buckets.map((b: any) => {
          const nextLevelSource = source[1];
          let nextLevelAggName = nextLevelSource.field + '_level_1';
          nextLevelAggName = b[nextLevelAggName] ? nextLevelAggName : (nextLevelSource.field + '.keyword_level_1');
          const subBuckets = b[nextLevelAggName] ? b[nextLevelAggName].buckets : (b.buckets ? b.buckets : []);

          const found = subBuckets.find(sb => sb.key === name);
          if (!found) return null;

          const value = found.metric ? found.metric.value : found.doc_count;

          const point: any = {
            name: b.key, // Category name from Level 1
            y: value,
            source: nextLevelSource.field,
          };

          // Drilldown from level 2 to level 3+
          if (source.length > 2) {
            const nextLevelIndex = 2;
            const drilldownSource = source[nextLevelIndex];
            let drilldownAggName = drilldownSource.field + '_level_' + nextLevelIndex;
            drilldownAggName = found[drilldownAggName] ? drilldownAggName : (drilldownSource.field + '.keyword_level_' + nextLevelIndex);
            const drilldownBuckets = found[drilldownAggName] ? found[drilldownAggName].buckets : (found.buckets ? found.buckets : []);

            if (drilldownBuckets && drilldownBuckets.length > 0) {
              const drilldownId = `${b.key}_${name}_1`;
              point.drilldown = drilldownId;
              this.prepareDrilldownData(drilldownBuckets, drilldownSeries, nextLevelIndex, drilldownId, name, chartType);
            }
          }

          return point;
        }).filter(p => p !== null);

        return {
          name: name,
          data: data,
          type: chartType,
          stacking: isStacked ? 'normal' : undefined,
          source: source[0].field,
        };
      });
    } else {
      // Single level OR Multi-level with "plain" stacking (no grouping)
      const data = buckets.map((b: any) => {
        const value = b.metric ? b.metric.value : b.doc_count;
        const point: any = {
          name: b.key,
          y: value,
          source: source[0].field,
        };

        // If it's multi-level and "plain", Level 2 is the first drilldown
        if (isMultiLevel && isPlain) {
          const nextLevelIndex = 1;
          const drilldownSource = source[nextLevelIndex];
          let drilldownAggName = drilldownSource.field + '_level_' + nextLevelIndex;
          drilldownAggName = b[drilldownAggName] ? drilldownAggName : (drilldownSource.field + '.keyword_level_' + nextLevelIndex);
          const drilldownBuckets = b[drilldownAggName] ? b[drilldownAggName].buckets : (b.buckets ? b.buckets : []);

          if (drilldownBuckets && drilldownBuckets.length > 0) {
            const drilldownId = `${b.key}_0`;
            point.drilldown = drilldownId;
            this.prepareDrilldownData(drilldownBuckets, drilldownSeries, nextLevelIndex, drilldownId, b.key, chartType);
          }
        }

        return point;
      });

      series = [{
        name: 'Main',
        showInLegend: isMultiLevel && !isPlain,
        data: data,
        type: chartType,
        source: source[0].field,
      }];
    }

    const dataLabelsSettings = this.cms.getDataLabelAttributes(
      this.componentConfigs,
      chartType,
    );

    this.chartOptions = {
      chart: { type: chartType },
      xAxis: { crosshair: true, type: 'category' },
      boost: {
        enabled: true,
        useGPUTranslations: true,
      },
      yAxis: {
        min: 0,
        title: {
          text: this?.items_label ? this.items_label : '',
        },
      },
      colors: this.colors,
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 2.5,
          dataLabels: dataLabelsSettings,
          stacking: chartType === 'column' && isStacked ? 'normal' : undefined,
          colorByPoint: isPlain || !isMultiLevel,
        },
        bar: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 2.5,
          dataLabels: dataLabelsSettings,
          stacking: chartType === 'bar' && isStacked ? 'normal' : undefined,
          colorByPoint: isPlain || !isMultiLevel,
        },
        series: {
          point: {
            events: {
              click: (e: any) => {
                if (
                  !e.point.destroyed &&
                  !e.point.drilldown &&
                  this.componentConfigs.allowFilterOnClick
                ) {
                  this.Query(e.point.name, e.point.source);
                  this.filtered = e.point.source;
                }
              },
            },
          },
        },
      },
      tooltip: {
        formatter: function () {
          if (this.points) {
            let total = 0;
            const points = this.points.map((point) => {
              total += Number(point.y);
              return `<tr><td style="color: ${point.color}; padding: 0">${point.series.name}: </td><td style="padding:0"><b>${point.y}</b></td></tr>`;
            });
            return `<span>${this.x}: <b>${total}</b></span><table>${points.join(
              '',
            )}</table>`;
          } else {
             return `<span>${this.key}: <b>${this.y}</b></span>`;
          }
        },
        useHTML: true,
      },
      series: series as any,
      drilldown: {
        series: drilldownSeries as any
      },
      ...this.cms.commonProperties(),
    };
    this.reloadComponent();
  }

  private prepareDrilldownData(
    buckets: any[],
    drilldownSeries: any[],
    levelIndex: number,
    drilldownId: string,
    pointName: string,
    chartType: string = 'column'
  ) {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const data = buckets.map(b => {
      const point: any = {
        name: b.key,
        y: b.metric ? b.metric.value : b.doc_count,
        source: source[levelIndex].field,
      };

      const nextLevelIndex = levelIndex + 1;
      if (source.length > nextLevelIndex) {
        const nextLevelSource = source[nextLevelIndex];
        let nextLevelAggName = nextLevelSource.field + '_level_' + nextLevelIndex;
        nextLevelAggName = b[nextLevelAggName] ? nextLevelAggName : (nextLevelSource.field + '.keyword_level_' + nextLevelIndex);
        const subBuckets = b[nextLevelAggName] ? b[nextLevelAggName].buckets : (b.buckets ? b.buckets : []);

        if (subBuckets && subBuckets.length > 0) {
          const subDrilldownId = `${drilldownId}_${b.key}_${levelIndex}`;
          point.drilldown = subDrilldownId;
          this.prepareDrilldownData(subBuckets, drilldownSeries, nextLevelIndex, subDrilldownId, b.key, chartType);
        }
      }
      return point;
    });

    drilldownSeries.push({
      id: drilldownId,
      name: pointName,
      data: data,
      type: chartType
    });
  }
  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
