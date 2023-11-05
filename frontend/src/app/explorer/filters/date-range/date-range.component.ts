import { Component, OnInit } from '@angular/core';
import { ComponentFilterConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { Store } from '@ngrx/store';
import * as fromStore from '../../store';
import { ElasticsearchQuery, BuildQueryObj } from '../services/interfaces';
import { BodyBuilderService } from '../services/bodyBuilder/body-builder.service';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ComponentLookup } from '../../dashboard/components/dynamic/lookup.registry';
import { RangeService } from '../services/range/range.service';

import * as dayjs from 'dayjs';

import { ActivatedRoute } from '@angular/router';
// eslint-disable-next-line no-duplicate-imports

@ComponentLookup('DateRangeComponent')
@Component({
  selector: 'app-date-range',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.scss'],
  providers: [RangeService]
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
    public activeRoute: ActivatedRoute,
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
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');

    const qb: BuildQueryObj = {
      size: 100000,
    };
    this.rangeService
      .getMaxAndMin(
        this.rangeService.buildminmaxquery(qb).build() as ElasticsearchQuery,
        true,
        dashboard_name
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
      const filters = this.bodyBuilderService.getFiltersFromQuery();
      filters.forEach((element) => {
        for (const key in element)
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
          gte: dayjs(this.fromDate).format('YYYY-MM-DD'),
          lte: dayjs(this.toDate).format('YYYY-MM-DD'),
        });
      this.rangeService.resetNotification({
        min: this.fromDate,
        max: this.toDate,
      });
      const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');

      this.store.dispatch(
        new fromStore.SetQuery({
          dashboard: dashboard_name ? dashboard_name : 'DEFAULT_DASHBOARD',
          body: query.build(),
        }),
      );
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
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');

    this.store.dispatch(
      new fromStore.SetQuery({
        dashboard: dashboard_name ? dashboard_name : 'DEFAULT_DASHBOARD',
        body: query.build(),
      }),
    );
  }
}
