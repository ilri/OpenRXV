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
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
@ComponentLookup('WordcloudComponent')
@Component({
  selector: 'app-wordcloud',
  templateUrl: './wordcloud.component.html',
  styleUrls: ['./wordcloud.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordcloudComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,
    private readonly bodyBuilderService: BodyBuilderService
  ) {
    super(cms, selectService, store);
  }
  colors: string[]
  async ngOnInit() {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    let appearance = await this.settingsService.readAppearanceSettings()
    this.colors = appearance.chartColors;
    this.init('wordcloud');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      let filters = this.bodyBuilderService.getFiltersFromQuery().filter(element => Object.keys(element).indexOf(source + '.keyword') != -1)
      if (filters.length)
        this.filterd = true;
      else
        this.filterd = false;
      if (buckets) {
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  filterd = false;
  resetFilter(value: boolean = false) {
    this.resetQ()
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
        series: {
          point: {
            events: {
              click: this.componentConfigs.allowFilterOnClick == true ? this.setQ() : null,
            }
          }
        },
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
