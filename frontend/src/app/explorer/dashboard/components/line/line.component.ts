import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { BarService } from './../bar/services/bar/bar.service';
import { SettingsService } from 'src/app/admin/services/settings.service';

@ComponentLookup('LineComponent')
@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  providers: [ChartMathodsService, RangeService, BarService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LineComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService

  ) {
    super(cms);
  }
  colors : string[]
  async ngOnInit(){
    let appearance = await this.settingsService.readAppearanceSettings()
    this.colors = appearance.chartColors;
    this.init('line');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });

  }

  private setOptions(
    buckets: Array<Bucket>
  ): any {
    let categories = []
    buckets.forEach((b: Bucket) => {
      b.related.buckets.forEach(d => {
        if (categories.indexOf(d.key.substr(0, 50)) == -1)
          categories.push(d.key.substr(0, 50))
      })
    })

    let data = buckets.map((b: Bucket) => {
      let data = []
      categories.forEach((e, i) => {
        let found: Array<any> = b.related.buckets.filter(d => d.key.substr(0, 50) == e)
        if (found.length)
          data[i] = found[0].doc_count
        else
          data[i] = 0
      })
      return {
        name: b.key, data
      }
    }).flat(1)

    return {
      chart: { type: 'line' },
      xAxis: { categories, crosshair: true },
      boost: {
        enabled: true,
        useGPUTranslations: true
      },
      yAxis: { min: 0, title: { text: 'Information Products' } },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 2.5
        }
      },
      colors: this.colors,
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat:
          '<tr><td style="color:{series.color};padding:0">{series.name}: </td><td style="padding:0"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      series: data,
      ...this.cms.commonProperties()
    };
  }
}

