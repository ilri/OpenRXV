import {
  Injectable,
  EventEmitter,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import {
  ComponentDashboardConfigs,
  MergedSelect, SourceLevel,
} from 'src/app/explorer/configs/generalConfig.interface';
import { Observable, combineLatest } from 'rxjs';
import * as fromStore from '../../../../store';
import { Store } from '@ngrx/store';
import { ChartHelper } from '../chart/chart-helper.class';
import { ScrollHelperService } from '../scrollTo/scroll-helper.service';
import { first, map } from 'rxjs/operators';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { ViewState } from 'src/app/explorer/store/reducers/items.reducer';

@Injectable()
export class ChartMathodsService extends ChartHelper {
  private readonly store = inject<Store<fromStore.ItemsState>>(Store);

  private loadingHits$: Observable<boolean>;
  private cc: ComponentDashboardConfigs;
  private readonly shs: ScrollHelperService;
  goBuildDataSeries: EventEmitter<Bucket[] | MergedSelect>;

  get getExpanded(): boolean {
    return this.shs.expandedStatus;
  }

  get getLoadingHits$(): Observable<boolean> {
    return this.loadingHits$;
  }

  set setExpanded(expan: boolean) {
    this.shs.expandedVal = expan;
  }

  get getViewState(): ViewState {
    return this.shs.getViewState;
  }

  get getLoading(): boolean {
    return this.shs.getLoading;
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const cdr = inject(ChangeDetectorRef);

    super();
    this.shs = new ScrollHelperService(cdr);
    this.goBuildDataSeries = new EventEmitter();
  }

  init(chartType: string, cc: ComponentDashboardConfigs, cb?: () => any): void {
    this.chartType = chartType;
    this.cc = cc;
    this.shs.storeVal = this.store;
    this.shs.seeIfThisCompInView(this.cc.id);
    this.shs.dataIsReadyArrived.pipe(first()).subscribe(() => {
      if (cb) {
        cb();
      }
      this.subToDataFromStore();
    });
  }

  disPatchSetInView(collapsed: boolean): void {
    this.shs.disPatchSetInView(this.cc.id, collapsed);
  }

  private subToDataFromStore(): void {
    if (Array.isArray(this.cc.source)) {
      this.processNestedAggs();
    } else {
      this.processArraySorces();
    }
    this.loadingHits$ = this.store.select(fromStore.getLoadingOnlyHits);
  }

  private processNestedAggs(): void {
    this.store
      .select(fromStore.getNestedBuckets, this.cc.id)
      .subscribe((buckets: Bucket[]) => {
        this.goBuildDataSeries.emit(buckets || []);
      });
  }

  private processArraySorces(): void {
    const observableArr: Array<Observable<MergedSelect>> = [];
    (this.cc.source as Array<SourceLevel>).forEach((s: SourceLevel) => {
      observableArr.push(
        this.store
          .select(fromStore.getBuckets, s.field)
          .pipe(map((buckets: Bucket[]) => ({ [s.field]: buckets }))),
      );
    });
    this.zipObservablesAndOmit(observableArr);
  }

  private zipObservablesAndOmit(
    observableArr: Array<Observable<MergedSelect>>,
  ) {
    combineLatest(...observableArr)
      .pipe(
        map((msArr: Array<MergedSelect>) => {
          const obj: MergedSelect = {};
          msArr.forEach((ms: MergedSelect) => {
            const [key] = Object.keys(ms);
            obj[key] = ms[key];
          });
          return obj;
        }),
      )
      .subscribe((ms: MergedSelect) => this.goBuildDataSeries.emit(ms));
  }
}
