import {
  UpdateCallerBarChart,
  BarComposerHelper,
} from '../../../list/paginated-list/filter-paginated-list/types.interface';
import {
  ElasticsearchQuery,
  BucketWithInnerBuckts,
  ElasticsearchResponse,
  Bucket,
  ResetOptions,
} from 'src/app/explorer/filters/services/interfaces';
import { MergedSelect } from 'src/app/explorer/configs/generalConfig.interface';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { EventEmitter } from '@angular/core';
import * as bodybuilder from 'bodybuilder';
/**
 * right now `buckets` will contain
 *   - `index[0] from the source confs`: `Array<Bucket>`
 *   - `index[1] from the source confs`: `Array<Bucket>`
 * `selectedCategories` & `selectedYears` is the selected options which get set for the first time when
 * the user loads the page, when the user select a filter from the side filters, and when the bar
 * filters changes the selected values stays the same.
 * `barTypes` & `barYears`: is just the mapped buckets to array of primitives(string | number) for
 * the bar select options.
 */
export class BarServiceComposer {
  selectedYears: Array<string>;
  selectedCategories: Array<string>;
  buckets: MergedSelect;
  barTypes: Array<string>;
  barYears: Array<string>;
  protected doWeHaveQueryInTheMainQuery: boolean;
  protected rangeService: RangeService;
  protected getDataNow: EventEmitter<UpdateCallerBarChart>;
  protected firstSourceKey: string;
  protected secondSourceKey: string;

  get firstFilterKeyWord(): string {
    return this.firstSourceKey.includes('keyword')
      ? this.firstSourceKey
      : `${this.firstSourceKey}.keyword`;
  }

  get secondFilterKeyWord(): string {
    return this.secondSourceKey.includes('keyword')
      ? this.secondSourceKey
      : `${this.secondSourceKey}.keyword`;
  }

  constructor() {
    this.getDataNow = new EventEmitter<UpdateCallerBarChart>();
  }

  protected buildQuery(
    queryToMerge?: bodybuilder.Bodybuilder,
    changeBy?: UpdateCallerBarChart,
  ): ElasticsearchQuery {
    const [yearsLen, typeLen] = this.yearAndLenSize();
    const q = bodybuilder()
      .size(0)
      .aggregation(
        'terms',
        this.secondFilterKeyWord,
        { size: yearsLen },
        'y',
        (query) =>
          query.aggregation(
            'terms',
            '',
            {
              field: this.firstFilterKeyWord,
              size: typeLen,
            },
            'x',
          ),
      );

    if (changeBy === UpdateCallerBarChart.BarChartNgSelect) {
      this.addYearsAndTypesToQuery(queryToMerge, changeBy);
    }

    const finalQuery: ElasticsearchQuery = {
      ...(q.build() as ElasticsearchQuery),
      query: { ...(queryToMerge.build() as ElasticsearchQuery).query },
    };
    if (!Object.keys(finalQuery.query).length) {
      delete finalQuery.query;
    }
    return finalQuery;
  }

  protected yearAndLenSize(): [number, number] {
    return [
      this.selectedYears
        ? this.selectedYears.length === 0
          ? 2147483647
          : this.doWeHaveQueryInTheMainQuery
            ? 5
            : this.selectedYears.length
        : 5,
      this.selectedCategories
        ? this.selectedCategories.length === 0
          ? 2147483647
          : this.doWeHaveQueryInTheMainQuery
            ? 5
            : this.selectedCategories.length
        : 5,
    ];
  }

  protected addYearsAndTypesToQuery(
    queryToMerge: bodybuilder.Bodybuilder,
    changeBy: UpdateCallerBarChart,
  ): void {
    if (changeBy === UpdateCallerBarChart.BarChartNgSelect) {
      if (this.selectedYears.length) {
        queryToMerge.query(
          'terms',
          this.secondFilterKeyWord,
          this.selectedYears,
        );
      }
      if (this.selectedCategories.length) {
        queryToMerge.query(
          'terms',
          this.firstFilterKeyWord,
          this.selectedCategories,
        );
      }
    }
  }

  protected updateNgSelectOptions(): void {
    if (this.buckets[this.firstSourceKey]) {
      this.barTypes = this.buckets[this.firstSourceKey].map(
        ({ key }: Bucket) => key,
      );
    }
    if (this.buckets[this.secondSourceKey]) {
      // number when the year range filter changes !
      this.barYears = this.buckets[this.secondSourceKey].map(
        (b: Bucket | number) => (typeof b !== 'number' ? b.key : `${b}`),
      );
    }
  }

  protected subToShouldReset(composer: BarComposerHelper, source: string) {
    this.rangeService.shouldReset.subscribe(
      ({ caller, data }: ResetOptions) => {
        if (caller === 'range' && data) {
          const { min, max } = data;
          const filterdYearsRange = [];
          for (let i = min; i <= max; i++) {
            filterdYearsRange.push(i);
          }
          this.buckets = {
            ...this.buckets,
            [source]: filterdYearsRange,
          };
          composer.forgetYearsFromStore = true;
        }
        this.getDataNow.emit(UpdateCallerBarChart.SideFilters);
      },
    );
  }

  protected mapDataToColmns(
    res: ElasticsearchResponse,
    changeBy: UpdateCallerBarChart,
  ): Array<Highcharts.SeriesColumnOptions> {
    const series: Array<Highcharts.SeriesColumnOptions> =
      res.aggregations.y.buckets.map(
        (yBucket: BucketWithInnerBuckts) =>
          ({
            type: 'column',
            name: yBucket.key,
            value: yBucket.doc_count,
            data: yBucket.x.buckets.map((xBucket) => ({
              name: xBucket.key,
              y: xBucket.doc_count,
            })),
            animation: true,
          }) as Highcharts.SeriesColumnOptions,
      );
    this.selectDefaultOptions(series, changeBy);
    return series;
  }

  protected selectDefaultOptions(
    series: Array<Highcharts.SeriesColumnOptions>,
    changeBy: UpdateCallerBarChart,
  ): void {
    // binding the default selected values only the first time first two conditions.
    // replace the selected options when the SideFilters update the data.
    if (
      this.selectedCategories &&
      this.selectedYears &&
      changeBy === UpdateCallerBarChart.BarChartNgSelect
    ) {
      return;
    }
    const catSet: Set<string> = new Set<string>();
    series
      .flatMap(({ data }) => data)
      .forEach(({ name }: { y: number; name: string }) => catSet.add(name));
    this.selectedCategories = Array.from(catSet);
    this.selectedYears = series.map(
      ({ name }: Highcharts.SeriesColumnOptions) => name,
    );
  }
}
