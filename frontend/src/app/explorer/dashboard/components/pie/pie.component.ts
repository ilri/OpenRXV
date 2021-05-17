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
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
@ComponentLookup('PieComponent')
@Component({
  selector: 'app-pie',
  templateUrl: './pie.component.html',
  styleUrls: ['./pie.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieComponent extends ParentChart implements OnInit {
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
  colors: string[];
  filterd = false;
  async ngOnInit() {
        const { source } = this.componentConfigs as ComponentFilterConfigs;
    let appearance = await this.settingsService.readAppearanceSettings()
    this.colors = appearance.chartColors;
    this.init('pie');
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
  resetFilter(value: boolean = false) {
    this.resetQ()
  }
  private setOptions(buckets: Array<Bucket>): Highcharts.Options {
    return {
      chart: {
        type: 'pie',
        animation: true,
      },
      boost: {
        enabled: true,
        useGPUTranslations: true,
      },
      colors: this.colors,
      plotOptions: {
        pie: {
          cursor: 'pointer',
          showInLegend: true,
          tooltip: {
            pointFormat: '<b>{point.y}</b>',
            headerFormat: '{point.key}:',
          },
          dataLabels: {
            enabled: false,
          },
        },
        series: {
          point: {
            events: {
              click: this.componentConfigs.allowFilterOnClick == true? this.setQ() : null,
            }
          }
        }
      },
      series: [
        {
          animation: true,
          type: 'pie',
          data: buckets.map((b: Bucket) => ({ name: b.key.substr(0, 50), y: b.doc_count })),
        },
      ],
      ...this.cms.commonProperties(),
    };
  }
}
