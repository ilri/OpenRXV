import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { ParentChart } from '../../parent-chart';
import { ChartMathodsService } from '../../services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { BarService } from './../services/bar/bar.service';
import { ComponentLookup } from '../../dynamic/lookup.registry';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../../store';

@ComponentLookup('SingleBarComponent')
@Component({
  selector: 'app-rotated-lables',
  templateUrl: './rotated-lables.component.html',
  styleUrls: ['./rotated-lables.component.scss'],
  providers: [ChartMathodsService, RangeService, BarService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RotatedLablesComponent extends ParentChart implements OnInit {
  colors: string[]
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>
  ) {
    super(cms, selectService, store);
  }

  async ngOnInit() {
    let appearance = await this.settingsService.readAppearanceSettings()
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
    let data = buckets.map(function (values) { return [values.key, values.doc_count] })
    return {
      chart: {
        type: 'column'
      },
      xAxis: {
        type: 'category',
        labels: {
          rotation: -45,
          style: {
            fontSize: '13px',
            fontFamily: 'Verdana, sans-serif'
          }
        }
      },
      colors: this.colors,
      yAxis: {
        min: 0
      },
      legend: {
        enabled: false
      },
      series: [{
        data: data,
        ...this.cms.commonProperties()
      }]
    };
  }
}
