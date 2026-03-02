import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
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
  SourceLevel,
} from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-sunburst',
  templateUrl: './sunburst.component.html',
  styleUrls: ['./sunburst.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class SunburstComponent extends ParentChart implements OnInit {
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
  filterd = false;

  async ngOnInit() {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const sourceString = (source[0] as SourceLevel).field;

    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('sunburst');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      const filters = this.bodyBuilderService
        .getFiltersFromQuery()
        .filter(
          (element) =>
            Object.keys(element).indexOf(sourceString + '.keyword') != -1,
        );
      if (filters.length) this.filterd = true;
      else this.filterd = false;

      if (buckets) {
        this.setOptions(buckets, source);
      }
      this.cdr.detectChanges();
    });
  }

  resetFilter() {
    this.resetQ();
  }

  private setOptions(buckets: Array<Bucket>, source: SourceLevel[]) {
    const data: unknown[] = [];

    const levels: any = [
      {
        level: 1,
        dataLabels: {
          filter: {
            property: 'outerArcLength',
            operator: '>',
            value: 64,
          },
        },
      },
      {
        level: 2,
        colorByPoint: true,
      },
    ];
    if(source.length > 1) {
      for(let i = 3; i <= source.length; i++) {
        levels.push({
          level: i,
          colorVariation: {
            key: 'brightness',
            to: -0.5,
          },
        })
      }
    }

    data.push({
      id: '0.0',
      parent: '',
      name: 'Total',
    });

    this.prepareData(buckets, data, '0.0', 0);

    this.chartOptions = {
      chart: {
        type: 'sunburst',
        height: '100%',
      },
      colors: this.colors,
      plotOptions: {
        sunburst: {
          cursor: 'pointer',
          dataLabels: {
            format: '{point.name}',
            filter: {
              property: 'innerArcLength',
              operator: '>',
              value: 16,
            },
            rotationMode: 'circular',
          },
          levels,
        },
        series: {
          point: {
            events: {
              click: (e: any) => {
                if (
                  !e.point.destroyed &&
                  this.componentConfigs.allowFilterOnClick &&
                  e.point.id !== '0.0' &&
                  !e.point.hasChildren
                ) {
                  this.Query(e.point.name);
                }
              },
            },
          },
        },
      },
      series: [
        {
          type: 'sunburst',
          data: data,
          allowDrillToNode: true,
          cursor: 'pointer',
        } as unknown as Highcharts.SeriesOptionsType,
      ],
      tooltip: {
        headerFormat: '',
        pointFormat: '<b>{point.name}</b>: {point.value}',
      },
      ...this.cms.commonProperties(),
    };
    this.reloadComponent();
  }

  private prepareData(
    buckets: Bucket[],
    data: unknown[],
    parentId: string,
    levelIndex: number
  ) {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;

    buckets.forEach((b: Bucket) => {
      const id = `${parentId}_${b.key}`;
      const bucketWithMetric = b as Bucket & { metric?: { value: number } };
      const value = bucketWithMetric.metric ? bucketWithMetric.metric.value : b.doc_count;

      const point: { id: string; parent: string; name: string; value?: number; hasChildren?: boolean } = {
        id: id,
        parent: parentId,
        name: b.key,
      };

      const nextLevelIndex = levelIndex + 1;
      let hasChildren = false;

      if (Array.isArray(source) && source.length > nextLevelIndex) {
        const nextLevelSource = source[nextLevelIndex];
        let nextLevelAggName = nextLevelSource.field + '_level_' + nextLevelIndex;
        nextLevelAggName = b[nextLevelAggName]
          ? nextLevelAggName
          : nextLevelSource.field + '.keyword_level_' + nextLevelIndex;
        const subBuckets = b[nextLevelAggName]
          ? b[nextLevelAggName].buckets
          : b.buckets
          ? b.buckets
          : [];

        if (subBuckets && subBuckets.length > 0) {
          hasChildren = true;
          this.prepareData(subBuckets, data, id, nextLevelIndex);
        }
      }

      if (!hasChildren) {
        point.value = value;
      } else {
        point.hasChildren = true;
      }

      data.push(point);
    });
  }

  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
