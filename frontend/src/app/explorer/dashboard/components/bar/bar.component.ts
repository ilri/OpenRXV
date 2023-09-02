import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ParentChart } from '../parent-chart';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { BarService } from './services/bar/bar.service';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ActivatedRoute } from '@angular/router';

@ComponentLookup('BarComponent')
@Component({
  selector: 'app-bar',
  templateUrl: './bar.component.html',
  styleUrls: ['./bar.component.scss'],
  providers: [ChartMathodsService, RangeService, BarService, SelectService],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class BarComponent extends ParentChart implements OnInit {
  enabled: boolean;
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    private settingsService: SettingsService,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,
    activatedRoute: ActivatedRoute,
  ) {
    super(cms, selectService, store, activatedRoute);
  }
  colors: string[];
  async ngOnInit() {
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    const appearance = await this.settingsService.readAppearanceSettings(
      dashboard_name,
    );
    this.colors = appearance.chartColors;
    this.init('column');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      if (buckets) {
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  setOptions(buckets: Array<Bucket>) {
    const categories = [];
    buckets.forEach((b: Bucket) => {
      b.related.buckets.forEach((d) => {
        if (categories.indexOf(d.key.substr(0, 50)) == -1)
          categories.push(d.key.substr(0, 50));
      });
    });
    const data: any = buckets
      .map((b: Bucket) => {
        const data = [];
        categories.forEach((e, i) => {
          const found: Array<any> = b.related.buckets.filter(
            (d) => d.key.substr(0, 50) == e,
          );
          if (found.length) data[i] = found[0].doc_count;
          else data[i] = 0;
        });
        return {
          name: b.key,
          data,
        };
      })
      .flat(1);
    this.chartOptions = {
      chart: { type: 'column' },
      xAxis: { categories, crosshair: true },
      boost: {
        enabled: true,
        useGPUTranslations: true,
      },
      yAxis: { min: 0, title: { text: 'Information Products' } },
      colors: this.colors,
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          borderRadius: 2.5,
        },
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat:
          '<tr><td style="color:{series.color};padding:0">{series.name}: </td><td style="padding:0"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true,
      },
      series: data,
      ...this.cms.commonProperties(),
    };
    this.reloadComponent();
  }
  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
