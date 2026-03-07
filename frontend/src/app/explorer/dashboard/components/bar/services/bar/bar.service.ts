import { Injectable, EventEmitter, inject } from '@angular/core';
import { MergedSelect } from 'src/app/explorer/configs/generalConfig.interface';
import { ItemsService } from 'src/app/explorer/services/itemsService/items.service';
import { RangeService } from 'src/app/explorer/filters/services/range/range.service';
import { map, first, delay } from 'rxjs/operators';
import { ESHttpError } from 'src/app/explorer/store/actions/actions.interfaces';
import {
  UpdateCallerBarChart,
  BarComposerHelper,
} from '../../../list/paginated-list/filter-paginated-list/types.interface';
import { Observable } from 'rxjs';
import { BarServiceComposer } from './bar.service.composer';
import { ElasticsearchResponse } from 'src/app/explorer/filters/services/interfaces';

/**
 * `barLoading`: a boolean that shows a `ngx-loading` separated from another `ngx-loading` which is linked
 * with the side filters.
 */
@Injectable()
export class BarService extends BarServiceComposer {
  private readonly itemsService = inject(ItemsService);

  setChartOptinos: EventEmitter<Array<Highcharts.SeriesColumnOptions>>;
  barLoading: boolean;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    super();
    this.setChartOptinos = new EventEmitter<
      Array<Highcharts.SeriesColumnOptions>
    >();
    this.barLoading = false;
    this.getDataNow.subscribe(this.getData.bind(this));
  }

  init(
    rangeService: RangeService,
    isThereIsQueryInTheMainQuery$: Observable<boolean>,
    firstSourceKey: string,
    secondSourceKey: string,
  ): void {
    this.firstSourceKey = firstSourceKey;
    this.secondSourceKey = secondSourceKey;
    this.rangeService = rangeService;
    // the delay is just to allow `doWeHaveQueryInTheMainQuery` to change the query behavior
    // before changing ~ in `yearAndLenSize` method.
    isThereIsQueryInTheMainQuery$
      .pipe(delay(1))
      .subscribe((b: boolean) => (this.doWeHaveQueryInTheMainQuery = b));
  }

  /**
   * gets called when the `side filters`, `bar filters` changes, and on the first load.
   * @param changeBy determine if you should change the `selectedYears` & `selectedTypes`.
   * we are getting the query that the filters uses and merged with a custom query
   * for the bar chart (the `this.rangeService.buildQuery()` line...).
   */
  getData(changeBy?: UpdateCallerBarChart): void {
    this.barLoading = true;
    this.itemsService
      .getItems(
        this.buildQuery(this.rangeService.buildquery({ size: 12 }), changeBy),
      )
      .pipe(
        map((value: ElasticsearchResponse) =>
          this.mapDataToColmns(value, changeBy),
        ),
        first(),
      )
      .subscribe(
        (series: Array<Highcharts.SeriesColumnOptions>) => {
          this.barLoading = false;
          this.setChartOptinos.emit(series);
        },
        (error: ESHttpError) => {
          this.barLoading = false;
          this.setChartOptinos.emit();
        },
      );
  }

  yearsComposer(source: string): (b: MergedSelect) => void {
    const composer: BarComposerHelper = {
      subFlag: true,
      forgetYearsFromStore: false,
    };
    return (b: MergedSelect) => {
      if (composer.subFlag) {
        this.getData();
        this.subToShouldReset(composer, source);
      }
      if (!composer.forgetYearsFromStore) {
        this.buckets = { ...b };
      }
      composer.subFlag = false;
      composer.forgetYearsFromStore = false;
      this.updateNgSelectOptions();
    };
  }
}
