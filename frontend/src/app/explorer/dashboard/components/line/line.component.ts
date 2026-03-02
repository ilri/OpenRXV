import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
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
import {ComponentDashboardConfigs, SourceLevel} from "../../../configs/generalConfig.interface";
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class LineComponent extends ParentChart implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private settingsService = inject(SettingsService);
  private readonly bodyBuilderService = inject(BodyBuilderService);
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
  filterd = false;

  async ngOnInit() {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const sourceString = (source[0] as SourceLevel).field;

    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('line');
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
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }

  setOptions(buckets: Array<Bucket>) {
    const { source, line_type } = this.componentConfigs as ComponentDashboardConfigs;
    const chartType = line_type || 'line';

    const data = buckets.map((b: any) => ({
      name: b.key,
      y: b.metric ? b.metric.value : b.doc_count,
    }));

    const series = [
      {
        name: this.componentConfigs.title,
        data: data,
        type: chartType,
      },
    ];

    const dataLabelsSettings = this.cms.getDataLabelAttributes(
      this.componentConfigs,
      'column', // Use column logic for data labels count
    );

    this.chartOptions = {
      chart: {
        type: chartType,
      },
      colors: this.colors,
      xAxis: {
        type: 'category',
        crosshair: true,
      },
      yAxis: {
        title: {
          text: '',
        },
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
                  this.Query(e.point.name);
                }
              },
            },
          },
        },
        line: {
          dataLabels: dataLabelsSettings,
          enableMouseTracking: true,
        },
        area: {
          dataLabels: dataLabelsSettings,
          stacking: 'normal',
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
      ...this.cms.commonProperties(),
    };
    this.reloadComponent();
  }

  resetFilter() {
    this.resetQ();
  }

  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
