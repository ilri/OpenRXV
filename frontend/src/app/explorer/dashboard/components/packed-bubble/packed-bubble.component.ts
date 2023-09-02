import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ActivatedRoute } from '@angular/router';
@ComponentLookup('PackedBubbleComponent')
@Component({
  selector: 'app-packed-bubble',
  templateUrl: './packed-bubble.component.html',
  styleUrls: ['./packed-bubble.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackedBubbleComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,
    activatedRoute:ActivatedRoute
  ) {
    super(cms, selectService, store,activatedRoute);
  }
  colors: string[];
  async ngOnInit() {
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    const appearance = await this.settingsService.readAppearanceSettings(dashboard_name);
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

    const min = sorted[0];
    const max = sorted.reduce((a, b) => a + b) / sorted.length;
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
