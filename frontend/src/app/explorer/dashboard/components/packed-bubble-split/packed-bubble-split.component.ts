import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import * as Highcharts from 'highcharts';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';

@ComponentLookup('PackedBubbleSplitComponent')
@Component({
  selector: 'app-packed-bubble-split',
  templateUrl: './packed-bubble-split.component.html',
  styleUrls: ['./packed-bubble-split.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackedBubbleSplitComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,

  ) {
    super(cms,null,null);
  }
  colors : string[]

  async ngOnInit() {
    let appearance = await this.settingsService.readAppearanceSettings()
    this.colors = appearance.chartColors;
    this.init('packed-bubble-split');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }

  private setOptions(buckets: Array<Bucket>): any {

    let data = buckets.map((b: Bucket) => {
      return {
        name: b.key, data: b.related.buckets.filter(d => b.key != d.key).map(d => {
          return { name: d.key.substr(0, 50), value: d.doc_count }
        })
      }
    }).flat(1)

    let sorted = data.map(d => d.data.map(b => b.value)).flat(1).sort((a, b) => {
      return a - b
    })

    let min = sorted[0];
    let max = sorted.reduce((a, b) => a + b) / sorted.length;

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
        pointFormat: '<b>{point.name}:</b> {point.value}'
      },
      colors: this.colors,
      plotOptions: {
        packedbubble: {
          minSize: '30%',
          maxSize: '100%',
          zMin: min,
          zMax: max,
          layoutAlgorithm: {
            gravitationalConstant: 0.05,
            splitSeries: true,
            seriesInteraction: false,
            dragBetweenSeries: true,
            parentNodeLimit: true
          },
          dataLabels: {
            enabled: true,
            format: '{point.name}',
            filter: {
              property: 'y',
              operator: '>',
              value: max
            },
            style: {
              color: 'black',
              textOutline: 'none',
              fontWeight: 'normal'
            }
          }
        }
      },
      series: data,
      ...this.cms.commonProperties(),
    };
  }
}
