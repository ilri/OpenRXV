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
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';

@ComponentLookup('LineComponent')
@Component({
  selector: 'app-line',
  templateUrl: './line.component.html',
  styleUrls: ['./line.component.scss'],
  providers: [ChartMathodsService, RangeService, BarService, SelectService],
  changeDetection: ChangeDetectionStrategy.Default
})
export class LineComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>
  ) {
    super(cms, selectService, store);
  }
  enabled: boolean;

  colors: string[]
  async ngOnInit() {
    let appearance = await this.settingsService.readAppearanceSettings()
    this.colors = appearance.chartColors;
    this.init('line');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });

  }

  setOptions(
    buckets: Array<Bucket>
  ){
    let categories = []
    buckets.forEach((b: Bucket) => {
      b.related.buckets.forEach(d => {
        if (categories.indexOf(d.key.substr(0, 50)) == -1)
          categories.push(d.key.substr(0, 50))
      })
    })

    let data: any = buckets.map((b: Bucket) => {
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
    data.map((a, i) => { a.name = categories[i], a.data = [] })
    buckets.forEach(element => {
      element.related.buckets.forEach((element, index) => {
        data[index].data.push(element.doc_count)
      });
    });
    this.chartOptions = {
      title: {
        text: undefined
      },
      chart: {
        type: 'line'
      },
      plotOptions: {
        line: {
          dataLabels: {
            enabled: true
          },
          enableMouseTracking: true
        }
      },
      xAxis: {
        title: {
          text: 'Date'
        },
        accessibility: {
          description: undefined
        },
        categories: buckets.map(a => a.key)
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
