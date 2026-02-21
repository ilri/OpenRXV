import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-pie',
  templateUrl: './pie.component.html',
  styleUrls: ['./pie.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class PieComponent extends ParentChart implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private settingsService = inject(SettingsService);
  readonly selectService: SelectService;
  readonly store: Store<fromStore.AppState>;
  private readonly bodyBuilderService = inject(BodyBuilderService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const cms = inject(ChartMathodsService);
    const selectService = inject(SelectService);
    const store = inject<Store<fromStore.AppState>>(Store);
    const activatedRoute = inject(ActivatedRoute);

    super(cms, selectService, store, activatedRoute);

    this.selectService = selectService;
    this.store = store;
  }
  colors: string[];
  filterd = false;
  enabled: boolean;
  async ngOnInit() {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.colors = appearance.chartColors;
    this.init('pie');
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      const filters = this.bodyBuilderService
        .getFiltersFromQuery()
        .filter(
          (element) => Object.keys(element).indexOf(source + '.keyword') != -1,
        );
      if (filters.length) this.filterd = true;
      else this.filterd = false;
      if (buckets) {
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  resetFilter(value = false) {
    this.resetQ();
  }
  private setOptions(buckets: Array<Bucket>) {
    const commonProperties = this.cms.commonProperties();
    commonProperties.legend.labelFormatter = function () {
      const label = `${this.name} (${(this as any).y})`;
      return label.replace(
        new RegExp(`(?![^\\n]{1,${30}}$)([^\\n]{1,${30}})\\s`, 'g'),
        '$1<br>',
      );
    };
    commonProperties.legend.useHTML = true;

    const dataLabelsSettings = this.cms.getDataLabelAttributes(
      this.componentConfigs,
      'pie',
    );

    this.chartOptions = {
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
          dataLabels: dataLabelsSettings,
          size: dataLabelsSettings.enabled ? '75%' : '100%',
        },
        series: {
          point: {
            events: {
              click:
                this.componentConfigs.allowFilterOnClick == true
                  ? this.setQ()
                  : null,
            },
          },
        },
      },
      series: [
        {
          innerSize:
            !this.componentConfigs?.inner_size ||
            this.componentConfigs.inner_size <= 0 ||
            this.componentConfigs.inner_size > 100
              ? 0
              : this.componentConfigs.inner_size + '%',
          animation: true,
          type: 'pie',
          data: buckets.map((b: Bucket) => ({
            name: b.key.substr(0, 50),
            y: b.doc_count,
          })),
        },
      ],
      ...commonProperties,
    };
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }
}
