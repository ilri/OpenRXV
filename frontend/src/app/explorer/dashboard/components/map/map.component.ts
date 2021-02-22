import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
const mapWorld = require('@highcharts/map-collection/custom/world-robinson-highres.geo.json');
import * as Highcharts from 'highcharts';
import { ParentChart } from '../parent-chart';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { getCountryCode } from '../services/countryList.helper';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';

@ComponentLookup('MapComponent')
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [ChartMathodsService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapComponent extends ParentChart implements OnInit {
  constructor(
    cms: ChartMathodsService,
    private readonly cdr: ChangeDetectorRef,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,
    private readonly bodyBuilderService: BodyBuilderService
  ) {
    super(cms, selectService, store);
  }
  filterd = false;

  ngOnInit(): void {
    this.init('map');
    const { source } = this.componentConfigs as ComponentFilterConfigs;
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
        map: mapWorld
      },
      mapNavigation: {
        enabled: true,
        enableMouseWheelZoom: true,
        buttonOptions: {
          alignTo: 'spacingBox',
          verticalAlign: 'bottom'
        }
      },
      colorAxis: {
        min: 1,
        type: 'logarithmic',
        minColor: localStorage.getItem('minColor'),
        maxColor: localStorage.getItem('primaryColor'),
        stops: [
          [0, localStorage.getItem('minColor')],
          [0.67, localStorage.getItem('midColor')],
          [1, localStorage.getItem('primaryColor')]
        ]
      },
      plotOptions: {
        series: {
          point: {
            events: {
              click: this.setQ(),
            }
          }
        }
      },
      series: [
        {
          data: buckets.map((b: Bucket) => [
            getCountryCode(b.key),
            b.doc_count
          ]),
          mapData: mapWorld,
          showInLegend: false,
          cursor: 'pointer',
          enableMouseTracking: true,
          allowPointSelect: true,
          tooltip: {
            pointFormat: '{point.name}: <b>{point.value} Information Products</b><br/>',
            headerFormat: undefined
          },
          animation: {
            duration: 0
          },
          states: {
            hover: {
              color: '#427730',
            },
            select: {
              color: '#427730',
              borderColor: '#000000'
            }
          }
        }
      ],
      ...this.cms.commonProperties()
    } as Highcharts.Options;
  }
}
