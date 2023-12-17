import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
const mapWorld = require('@highcharts/map-collection/custom/world-robinson-highres.geo.json');
import * as Highcharts from 'highcharts';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';
import CountryISO from '@mohammad231/iso_3166-1';
import { Country } from '@mohammad231/iso_3166-1/iso_3166-1';
@ComponentLookup('MapComponent')
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,
    private readonly bodyBuilderService: BodyBuilderService,
    activatedRoute: ActivatedRoute,
  ) {
    super(cms, selectService, store, activatedRoute);
  }
  filterd = false;
  ngOnInit(): void {
    this.init('map');
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      const filters = this.bodyBuilderService
        .getFiltersFromQuery()
        .filter(
          (element) => Object.keys(element).indexOf(source + '.keyword') != -1,
        );
      if (filters.length) this.filterd = true;
      else this.filterd = false;
      if (buckets) {
        this.chartOptions = this.setOptions(buckets);
      }
      this.cdr.detectChanges();
    });
  }
  resetFilter(value = false) {
    this.resetQ();
  }
  private setOptions(buckets: Array<Bucket>): Highcharts.Options {
    return {
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
          data: buckets.map((b: Bucket) => [
            this.mapCountryToIsoAlpha2(b.key),
            b.doc_count,
          ]),
          mapData: mapWorld,
          showInLegend: false,
          cursor: 'pointer',
          enableMouseTracking: true,
          allowPointSelect: true,
          tooltip: {
            pointFormat:
              '{point.name}: <b>{point.value} Information Products</b><br/>',
            headerFormat: undefined,
          },
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
      ],
      ...this.cms.commonProperties(),
    } as Highcharts.Options;
  }

  mapCountryToIsoAlpha2(value: string) {
    const country = CountryISO.get({
      name: value,
      common_name: value,
      official_name: value,
    }) as Country;
    return country ? country.alpha_2 : undefined;
  }
}
