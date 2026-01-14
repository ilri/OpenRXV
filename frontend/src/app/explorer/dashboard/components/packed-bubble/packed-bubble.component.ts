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
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-packed-bubble',
  templateUrl: './packed-bubble.component.html',
  styleUrls: ['./packed-bubble.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class PackedBubbleComponent extends ParentChart implements OnInit {
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
  async ngOnInit() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('packed-bubble');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }

  private setOptions(buckets: Array<Bucket>): any {
    const data = buckets
      .map((b: Bucket) => {
        return {
          name: b.key,
          data: b.related.buckets
            .filter((d) => b.key != d.key)
            .map((d) => {
              return { name: d.key.substr(0, 50), value: d.doc_count };
            }),
        };
      })
      .flat(1);

    const sorted = data
      .map((d) => d.data.map((b) => b.value))
      .flat(1)
      .sort((a, b) => {
        return a - b;
      });

    const min = sorted.length ? sorted[0] : 0;
    const max = sorted.length
      ? sorted.reduce((a, b) => a + b) / sorted.length
      : 0;
    return {
      chart: {
        type: 'packedbubble',
        animation: false,
      },
      boost: {
        enabled: true,
        useGPUTranslations: true,
      },
      tooltip: {
        useHTML: true,
        pointFormat: '<b>{point.name}:</b> {point.value}',
      },
      colors: this.colors,
      plotOptions: {
        packedbubble: {
          minSize: '50%',
          maxSize: '150%',
          zMin: min,
          zMax: max,
          layoutAlgorithm: {
            splitSeries: false,
            gravitationalConstant: 0.02,
          },
          dataLabels: {
            enabled: true,
            format: '{point.name}',
            filter: {
              property: 'y',
              operator: '>',
              value: max,
            },
            style: {
              color: 'black',
              textOutline: 'none',
              fontWeight: 'normal',
            },
          },
        },
      },
      series: data,
      ...this.cms.commonProperties(),
    };
  }
}
