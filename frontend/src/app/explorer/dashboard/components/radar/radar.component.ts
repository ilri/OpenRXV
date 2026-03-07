import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
  OnDestroy,
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';
import { ComponentDashboardConfigs } from '../../../configs/generalConfig.interface';

@Component({
  selector: 'app-radar',
  templateUrl: './radar.component.html',
  styleUrls: ['./radar.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class RadarComponent extends ParentChart implements OnInit, OnDestroy {
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
  enabled: boolean;
  colors: string[];
  filtered: string = '';
  dashboard_name: string;

  async ngOnInit() {
    const dashboard_name =
      this.dashboard_name ??
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('radar');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }

  setOptions(buckets: Array<Bucket>) {
    const { source, line_type } = this
      .componentConfigs as ComponentDashboardConfigs;
    const chartType = line_type === 'area' ? 'area' : 'line';

    const data = buckets.map((b: any) => ({
      name: b.key,
      y: b.metric ? b.metric.value : b.doc_count,
      source: source[0].field,
    }));

    const series = [
      {
        name: this.componentConfigs.title,
        data: data,
        type: chartType,
        pointPlacement: 'on',
      },
    ];

    const dataLabelsSettings = this.cms.getDataLabelAttributes(
      this.componentConfigs,
      'column', // Use column logic for data labels count
    );

    this.chartOptions = {
      chart: {
        polar: true,
        type: chartType,
      },
      colors: this.colors,
      xAxis: {
        categories: data.map((d) => d.name),
        tickmarkPlacement: 'on',
        lineWidth: 0,
      },
      yAxis: {
        gridLineInterpolation: 'polygon',
        lineWidth: 0,
        min: 0,
      },
      plotOptions: {
        series: {
          point: {
            events: {
              click: (e: any) => {
                if (
                  !e.point.destroyed &&
                  this.componentConfigs.allowFilterOnClick
                ) {
                  this.Query(e.point.name, e.point.source);
                  this.filtered = e.point.source;
                }
              },
            },
          },
        },
        line: {
          dataLabels: dataLabelsSettings,
        },
        area: {
          dataLabels: dataLabelsSettings,
        },
      },
      tooltip: {
        pointFormat: '<b>{point.y}</b>',
        headerFormat: '{point.key}:',
      },
      series: series as any,
      ...this.cms.commonProperties(),
    };
    console.log(this.chartOptions);
    this.reloadComponent();
  }

  resetFilter(filtered: string) {
    this.resetQ(filtered);
    this.filtered = '';
  }

  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }

  ngOnDestroy(): void {
    this.buildOptions.unsubscribe();
  }
}
