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
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { BarService } from './../bar/services/bar/bar.service';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  providers: [ChartMathodsService, RangeService, BarService, SelectService],
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [ChartComponent],
})
export class LineComponent extends ParentChart implements OnInit {
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
  async ngOnInit() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('line');
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
    data.map((a, i) => {
      ((a.name = categories[i]), (a.data = []));
    });
    buckets.forEach((element) => {
      element.related.buckets.forEach((element, index) => {
        data[index].data.push(element.doc_count);
      });
    });
    this.chartOptions = {
      title: {
        text: undefined,
      },
      chart: {
        type: 'line',
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: true,
          },
          enableMouseTracking: true,
        },
      },
      xAxis: {
        title: {
          text: 'Date',
        },
        accessibility: {
          description: undefined,
        },
        categories: buckets.map((a) => a.key),
      },
      series: data,
    };
    this.reloadComponent();
  }
  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
