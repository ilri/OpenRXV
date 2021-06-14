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
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
@ComponentLookup('WheelComponent')
@Component({
  selector: 'app-wheel',
  templateUrl: './wheel.component.html',
  styleUrls: ['./wheel.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WheelComponent extends ParentChart implements OnInit {
  colors: string[]
  constructor(
    cms: ChartMathodsService,
    private settingsService: SettingsService,
    private readonly cdr: ChangeDetectorRef,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,
    private readonly bodyBuilderService: BodyBuilderService
  ) {
    super(cms, selectService, store);
  }
  filterd = false;
  resetFilter(value: boolean = false) {
    this.resetQ()
  }
  async ngOnInit() {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    let appearance = await this.settingsService.readAppearanceSettings()
    this.colors = appearance.chartColors;
    this.init('dependencywheel');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        let filters = this.bodyBuilderService.getFiltersFromQuery().filter(element => Object.keys(element).indexOf(source + '.keyword') != -1)
        if (filters.length)
          this.filterd = true;
        else
          this.filterd = false;
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  private setOptions(buckets: Array<Bucket>): any {
    let data = buckets.map((b: Bucket) => (b.related.buckets.filter(d => b.key != d.key).map(d => [b.key.substr(0, 50), d.key.substr(0, 50), d.doc_count]))).flat(1)
    return {
      accessibility: {
        point: {
          valueDescriptionFormat: '{index}. From {point.from} to {point.to}: {point.weight}.'
        }
      },
      plotOptions: {
        series: {
          point: {
            events: {
              click: this.componentConfigs.allowFilterOnClick == true ? this.setQ() : null,
            }
          }
        }
      },
      colors: this.colors,
      series: [{
        keys: ['from', 'to', 'weight'],
        data: data,
        type: 'dependencywheel',
        dataLabels: {
          color: '#333',
          textPath: {
            enabled: true,
            attributes: {
              dy: 5
            }
          },
          distance: 10
        },
        size: '95%'
      }],
      ...this.cms.commonProperties(),
    };
  }
}
