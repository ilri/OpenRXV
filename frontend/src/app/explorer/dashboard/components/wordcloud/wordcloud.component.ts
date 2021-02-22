import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { SettingsService } from 'src/app/admin/services/settings.service';
@ComponentLookup('WordcloudComponent')
@Component({
  selector: 'app-wordcloud',
  templateUrl: './wordcloud.component.html',
  styleUrls: ['./wordcloud.component.scss'],
  providers: [ChartMathodsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordcloudComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService
  ) {
    super(cms,null,null);
  }
  colors: string[]
  async ngOnInit() {
    let appearance = await this.settingsService.readAppearanceSettings()
    this.colors = appearance.chartColors;
    this.init('wordcloud');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }

  private setOptions(buckets: Array<Bucket>): Highcharts.Options {
    return {
      chart: {
        type: 'wordcloud',
        animation: true,
      },
      boost: {
        enabled: true,
        useGPUTranslations: true,
      },
      colors: this.colors,
      plotOptions: {
        wordcloud: {
          tooltip: {
            pointFormat: ' <b>{point.weight}</b>',
            headerFormat: '{point.key}:',
          } as Highcharts.TooltipOptions,
          rotation: 90,
          cursor: 'pointer',
          allowPointSelect: false,
        } as Highcharts.PlotWordcloudOptions,
      },
      series: [
        {
          type: 'wordcloud',
          data: buckets.map((b: Bucket) => ({
            name: b.key,
            weight: b.doc_count,
          })),
          animation: {
            duration: 200,
          },
        },
      ],
      ...this.cms.commonProperties(),
    };
  }
}
