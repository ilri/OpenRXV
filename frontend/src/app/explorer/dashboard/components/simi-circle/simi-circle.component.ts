import { Component, OnInit, inject } from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-simi-circle',
  templateUrl: './simi-circle.component.html',
  styleUrls: ['./simi-circle.component.scss'],
  providers: [ChartMathodsService, SelectService],
  imports: [ChartComponent],
})
export class SimiCircleComponent extends ParentChart implements OnInit {
  private settingsService = inject(SettingsService);
  readonly selectService: SelectService;
  readonly store: Store<fromStore.AppState>;

  colors: string[];

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

  async ngOnInit() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('pie');
    this.buildOptions.subscribe(() => (this.chartOptions = this.setOptions()));
  }

  private setOptions(): any {
    return {
      chart: {
        type: 'pie',
        animation: true,
      },
      title: {
        text: 'Items status',
        align: 'center',
        verticalAlign: 'middle',
      },
      colors: this.colors,
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>',
      },
      plotOptions: {
        pie: {
          dataLabels: {
            enabled: true,
            distance: -50,
          },
        },
      },
      series: [{ innerSize: '70%', ...this.chartOptions.series[0] }],
      ...this.cms.commonProperties(),
    };
  }
}
