import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import mapWorld from '@highcharts/map-collection/custom/world-robinson-highres.geo.json';
import * as Highcharts from 'highcharts';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import {
  ComponentDashboardConfigs,
  SourceLevel,
} from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';
import * as CountryISO from '@mohammad231/iso_3166-1';
import { Country } from '@mohammad231/iso_3166-1/iso_3166-1';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { ChartComponent } from '../chart/chart.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChartComponent],
})
export class MapComponent extends ParentChart implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  readonly selectService: SelectService;
  readonly store: Store<fromStore.AppState>;
  private readonly bodyBuilderService = inject(BodyBuilderService);
  private settingsService = inject(SettingsService);

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
  colors: string[] = [];
  filterd = false;
  items_label = 'Information Products';
  enabled: boolean;
  async ngOnInit() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance =
      await this.settingsService.readAppearanceSettings(dashboard_name);
    this.items_label = appearance.items_label;
    this.colors = appearance.chartColors;

    this.init('map');
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const sourceString = (source[0] as SourceLevel).field;

    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      const filters = this.bodyBuilderService
        .getFiltersFromQuery()
        .filter(
          (element) =>
            Object.keys(element).indexOf(sourceString + '.keyword') != -1,
        );
      if (filters.length) this.filterd = true;
      else this.filterd = false;
      if (buckets) {
        this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  resetFilter() {
    this.resetQ();
  }
  private setOptions(buckets: Array<Bucket>) {
    const { source, map_type } = this.componentConfigs as ComponentDashboardConfigs;
    const isMultiLevel = Array.isArray(source) && source.length > 1;

    const dataLabelsSettings = this.cms.getDataLabelAttributes(
      this.componentConfigs,
      'map',
    );

    const mapData = buckets.map((b: any) => ({
      name: b.key,
      path: this.mapCountryToIsoAlpha2(b.key),
      value: b.metric ? b.metric.value : b.doc_count,
    }))
      .filter(v => v.value > 0);

    let series: any[] = [
      {
        id: 'countries',
        data: mapData.map((d) => ({
          id: d.path,
          path: d.path,
          value: d.value,
          name: d.name,
        })),
        joinBy: ['hc-key', 'id'],
        mapData: mapWorld,
        showInLegend: false,
        cursor: 'pointer',
        enableMouseTracking: true,
        allowPointSelect: true,
        tooltip: {
          pointFormat:
            '{point.name}: <b>{point.value} ' +
            (this?.items_label ? this.items_label : '') +
            '</b><br/>',
          headerFormat: undefined,
        },
        dataLabels: dataLabelsSettings,
        animation: {
          duration: 0,
        },
        states: {
          hover: {
            color: '#427730',
          },
          select: {
            color: '#427730',
            borderColor: '#000000',
          },
        },
      },
    ];

    if (map_type === 'pie') {
      const pieSeries = buckets.map((b: any) => {
        const countryIso = this.mapCountryToIsoAlpha2(b.key);
        if (!countryIso) return null;

        let subBuckets = [];
        if (isMultiLevel) {
          const nextLevelSource = source[1];
          let nextLevelAggName = nextLevelSource.field + '_level_1';
          nextLevelAggName = b[nextLevelAggName] ? nextLevelAggName : (nextLevelSource.field + '.keyword_level_1');
          subBuckets = b[nextLevelAggName] ? b[nextLevelAggName].buckets : (b.buckets ? b.buckets : []);
        }

        if (subBuckets.length === 0) {
          subBuckets = [{ key: b.key, doc_count: b.doc_count, metric: b.metric }];
        }

        return {
          type: 'pie',
          name: b.key,
          zIndex: 6,
          minSize: 20,
          maxSize: 40,
          onPoint: {
            id: countryIso,position: {
              offsetX: 0,
              offsetY: 20
            }
          },
          colorAxis: false,
          states: {
            hover: {
              enabled: false,
            },
          },
          data: subBuckets.map((sb: any) => ({
            name: sb.key,
            y: sb.metric ? sb.metric.value : sb.doc_count,
          })),
          colors: this.colors,
          center: [0, 0],
          size: Math.max(20, Math.min(50, 10 * Math.log10((b.metric ? b.metric.value : b.doc_count) + 1))),
          dataLabels: {
            enabled: false,
          },
          tooltip: {
            headerFormat: '<b>{series.name}</b><br/>',
            pointFormat: '<span style="color: {point.color}">{point.name}: {point.y}</span>',
          },
        };
      }).filter(s => s !== null);
      series = [...series, ...pieSeries];
    }

    this.chartOptions = {
      chart: {
        map: mapWorld,
      },
      mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: true,
        buttonOptions: {
          alignTo: 'spacingBox',
          verticalAlign: 'bottom',
        },
      },
      colorAxis: {
        min: 1,
        type: 'logarithmic',
        minColor: localStorage.getItem('minColor'),
        maxColor: localStorage.getItem('primaryColor'),
        stops: [
          [0, localStorage.getItem('minColor')],
          [0.67, localStorage.getItem('midColor')],
          [1, localStorage.getItem('primaryColor')],
        ],
      },
      plotOptions: {
        pie: {
          borderWidth: 0,
          borderRadius: 0,
          shadow: false,
          states: {
            hover: {
              enabled: false,
            },
          },
        },
        series: {
          point: {
            events: {
              click: this.componentConfigs.allowFilterOnClick
                ? (e: any) => {
                    const name = e.point.name || e.point.series.name;
                    this.Query(name);
                  }
                : null,
            },
          },
        },
      },
      series: series as any,
      ...this.cms.commonProperties(),
    } as Highcharts.Options;
    this.reloadComponent();
  }

  reloadComponent() {
    this.enabled = false;
    this.cdr.detectChanges();
    this.enabled = true;
  }

  mapCountryToIsoAlpha2(value: string) {
    const country = CountryISO.get({
      name: value,
      common_name: value,
      official_name: value,
    }) as Country;
    return country ? country.alpha_2.toLowerCase() : undefined;
  }
}
