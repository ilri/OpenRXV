import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { ParentChart } from '../../parent-chart';
import { ChartMathodsService } from '../../services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { BarService } from './../services/bar/bar.service';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../../store';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../../chart/chart.component';

@Component({
  selector: 'app-rotated-lables',
  templateUrl: './rotated-lables.component.html',
  styleUrls: ['./rotated-lables.component.scss'],
  providers: [ChartMathodsService, RangeService, BarService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class RotatedLablesComponent extends ParentChart implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
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
    this.init('column');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }

  private setOptions(buckets: Array<Bucket>): any {
    const data = buckets.map(function (values) {
      return [values.key, values.doc_count];
    });
    return {
      chart: {
        type: 'bar',
      },
      xAxis: {
        type: 'category',
        labels: {
          rotation: -45,
          style: {
            fontSize: '13px',
            fontFamily: 'Verdana, sans-serif',
          },
        },
      },
      plotOptions: {
        series: {
          colorByPoint: true,
          colors: [...this.colors],
        },
      },
      yAxis: {
        min: 0,
      },
      legend: {
        enabled: false,
      },
      series: [
        {
          data: data,
          ...this.cms.commonProperties(),
        },
      ],
    };
  }
}
