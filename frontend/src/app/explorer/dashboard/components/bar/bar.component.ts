import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ParentChart } from '../parent-chart';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { BarService } from './services/bar/bar.service';
// // import { ComponentLookup } from '../dynamic/lookup.registry';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';


// // @ComponentLookup('BarComponent')
@Component({
    selector: 'app-bar',
    templateUrl: './bar.component.html',
    styleUrls: ['./bar.component.scss'],
    providers: [ChartMathodsService, RangeService, BarService, SelectService],
    changeDetection: ChangeDetectionStrategy.Default,
    imports: [ChartComponent]
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
  setOptions(buckets: Array<Bucket>) {
    const categories = [];
    buckets.forEach((b: Bucket) => {
      b.related.buckets.forEach((d) => {
        if (categories.indexOf(d.key.substr(0, 50)) == -1)
          categories.push(d.key.substr(0, 50));
      });
    });
    const data: any = buckets
      .map((b: Bucket) => {
        const data = [];
        categories.forEach((e, i) => {
          const found: Array<any> = b.related.buckets.filter(
            (d) => d.key.substr(0, 50) == e,
          );
          if (found.length) data[i] = found[0].doc_count;
          else data[i] = 0;
        });
        return {
          name: b.key,
          data,
        };
      })
      .flat(1);

    const dataLabelsSettings = this.cms.getDataLabelAttributes(
      this.componentConfigs,
      'bar',
    );

    this.chartOptions = {
      chart: { type: 'column' },
      xAxis: { categories, crosshair: true },
      boost: {
        enabled: true,
        useGPUTranslations: true,
      },
      yAxis: {
        min: 0,
        title: {
          text: this?.items_label ? this.items_label : 'Information Products',
        },
      },
      colors: this.colors,
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 2.5,
          dataLabels: dataLabelsSettings,
        },
      },
      tooltip: {
        formatter: function () {
          let total = 0;
          const points = this.points.map((point) => {
            total += Number(point.y);
            return `<tr><td style="color: ${point.color}; padding: 0">${point.series.name}: </td><td style="padding:0"><b>${point.y}</b></td></tr>`;
          });
          return `<span>${this.x}: <b>${total}</b></span><table>${points.join(
            '',
          )}</table>`;
        },
        shared: true,
        useHTML: true,
      },
      series: data,
      ...this.cms.commonProperties(),
    };
    this.reloadComponent();
  }
  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
