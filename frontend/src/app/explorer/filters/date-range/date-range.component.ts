import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  searchOptions,
  ComponentSearchConfigs,
  ComponentFilterConfigs,
  GeneralConfigs,
  ComponentDashboardConfigs,
} from 'src/app/explorer/configs/generalConfig.interface';
import { Store } from '@ngrx/store';
import * as fromStore from '../../store';
import {
  QuerySearchAttribute,
  ElasticsearchQuery,
  BuildQueryObj,
} from '../services/interfaces';
import { fromEvent } from 'rxjs';
import { map, debounceTime } from 'rxjs/operators';
import { BodyBuilderService } from '../services/bodyBuilder/body-builder.service';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ComponentLookup } from '../../dashboard/components/dynamic/lookup.registry';
import { type } from 'os';
import { RangeService } from '../services/range/range.service';

import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';

// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// eslint-disable-next-line no-duplicate-imports

const moment = _moment;

export const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@ComponentLookup('DateRangeComponent')
@Component({
  selector: 'app-date-range',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.scss'],
  providers: [
    RangeService,
    // `MomentDateAdapter` can be automatically provided by importing `MomentDateModule` in your
    // application's root module. We provide it at the component level here, due to limitations of
    // our example generation script.
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },

    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class DateRangeComponent extends ParentComponent implements OnInit {
  fromDate = null;
  toDate = null;
  fromMinDate = null;
  fromMaxDate = null;
  toMinDate = null;
  toMaxDate = null;
  searchTerm: string;
  range: number[];
  constructor(
    private readonly rangeService: RangeService,
    private readonly bodyBuilderService: BodyBuilderService,
    private readonly store: Store<fromStore.AppState>,
  ) {
    super();
    this.rangeService.storeVal = this.store;
  }

  ngOnInit() {
    let { source } = this.componentConfigs as ComponentFilterConfigs;
    source = source.replace('.keyword', '');
    this.rangeService.sourceVal = source;
    this.subtoToQuery(source);
  }

  getMinMaxValues(source) {
    const qb: BuildQueryObj = {
      size: 100000,
    };
    this.rangeService
      .getMaxAndMin(
        this.rangeService.buildminmaxquery(qb).build() as ElasticsearchQuery,
        true,
      )
      .subscribe(
        (n: any) => {
          this.fromMaxDate = n[`max_${source}`].value_as_string;
          this.fromMinDate = n[`min_${source}`].value_as_string;
          this.toMaxDate = n[`max_${source}`].value_as_string;
          this.toMinDate = n[`min_${source}`].value_as_string;
        }, // some queries will return empty array
      );
  }

  private subtoToQuery(source): void {
    this.store.select(fromStore.getQuery).subscribe((query) => {
      let filters = this.bodyBuilderService.getFiltersFromQuery();
      filters.forEach((element) => {
        for (var key in element)
          if (key == source) {
            this.fromDate = element[key].gte;
            this.toDate = element[key].lte;
          }
      });

      if (!filters.filter((element) => element[source]).length) {
        this.getMinMaxValues(source);
        this.fromDate = null;
        this.toDate = null;
      }
    });
  }

  dateChange(type) {
    if (this.toDate && this.fromDate) {
      const query: bodybuilder.Bodybuilder =
        this.rangeService.addAttributeToMainQuery({
          gte: moment(new Date(this.fromDate)).format('YYYY-MM-DD'),
          lte: moment(new Date(this.toDate)).format('YYYY-MM-DD'),
        });
      this.rangeService.resetNotification({
        min: this.fromDate,
        max: this.toDate,
      });
      this.store.dispatch(new fromStore.SetQuery(query.build()));
    } else if (type == 'from' && this.fromDate && !this.toDate) {
      this.toMinDate = this.fromDate;
    } else if (type == 'to' && this.toDate && !this.fromDate) {
      this.fromMaxDate = this.toDate;
    }
  }

  onYearSliderChange(): void {
    const [min, max] = this.range;
    const query: bodybuilder.Bodybuilder =
      this.rangeService.addAttributeToMainQuery({
        gte: min,
        lte: max,
      });
    this.rangeService.resetNotification({ min, max });
    this.store.dispatch(new fromStore.SetQuery(query.build()));
  }
}
