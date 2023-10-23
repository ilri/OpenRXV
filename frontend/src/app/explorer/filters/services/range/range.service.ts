import { Injectable } from '@angular/core';
import {
  ElasticsearchQuery,
  ElasticsearchResponse,
  Bucket,
  QueryYearAttribute,
  BuildQueryObj,
  ResetOptions,
  QuerySearchAttribute,
  QueryFilterAttribute,
} from '../interfaces';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, Subject, of } from 'rxjs';
import { map, tap, switchMap, first } from 'rxjs/operators';
import { BodyBuilderService } from '../bodyBuilder/body-builder.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';

@Injectable()
export class RangeService {
  private store: Store<fromStore.ItemsState>;
  private source: string;
  private readonly api_end_point: string = environment.api + '/search';
  constructor(
    private readonly http: HttpClient,
    private readonly bodyBuilderService: BodyBuilderService,
  ) {}

  set sourceVal(s: string) {
    this.source = s;
  }

  get sourceVal(): string {
    return this.source;
  }

  set storeVal(s: Store<fromStore.ItemsState>) {
    this.store = s;
  }

  get shouldReset(): Subject<ResetOptions> {
    return this.bodyBuilderService.shouldReset;
  }

  get orOperator(): Subject<boolean> {
    return this.bodyBuilderService.orOperator;
  }

  get getAggAttributes():
    | string
    | QueryYearAttribute
    | QuerySearchAttribute
    | QueryFilterAttribute {
    return this.bodyBuilderService.getAggAttributes;
  }

  resetNotification(data?: any): void {
    this.bodyBuilderService.resetOtherComponent({ data, caller: 'range' });
  }

  /**
   *
   * @param query is the query that gets the array of years
   * @param force when true we will get the years another time, even if had them !
   * * we are checking if we have the years, by getting them from the store
   * * if we do we simply retutn an observable of the years
   * * else we get them from the server.
   */
  getYears(
    query: ElasticsearchQuery,
    force = false,
    dashboard_name = 'DEFAULT_DASHBOARD',
  ): Observable<number[]> {
    return this.getYearsFromStore().pipe(
      switchMap((buckets: Array<Bucket>) =>
        buckets && buckets.length && !force
          ? of(buckets.map(({ key }) => +key))
          : this.httpGetYears(query, dashboard_name),
      ),
    );
  }
  getMaxAndMin(
    query: ElasticsearchQuery,
    force = false,
    dashboard_name,
  ): any {
    return this.httpGetMinAndMax(query, dashboard_name);
  }

  buildquery(bq: BuildQueryObj): bodybuilder.Bodybuilder {
    bq.size = bq.size ? bq.size : 10;
    bq.source = this.source;
    const q = this.bodyBuilderService.yearsBuildquery(bq, this.source);
    return q;
  }

  buildminmaxquery(bq: BuildQueryObj): bodybuilder.Bodybuilder {
    bq.size = bq.size ? bq.size : 10;
    bq.source = this.source;
    const q = this.bodyBuilderService.buildMinMaxQuery(bq);
    return q;
  }

  addAttributeToMainQuery(range): bodybuilder.Bodybuilder {
    const obj = {};
    obj[this.source] = range;
    this.bodyBuilderService.setAggAttributes = obj;
    return this.bodyBuilderService.buildMainQuery();
  }

  private getYearsFromStore(): Observable<Bucket[]> {
    // the reason I added the first pipe because we only need to check
    // for the years in the store not subscribe to the years
    // which might create side effect like sending the request multiple times
    // on force === true, in the `this.getYears()`
    return this.store.select(fromStore.getBuckets, this.source).pipe(first());
  }

  private httpGetYears(
    query: ElasticsearchQuery,
    dashboard_name,
  ): Observable<number[]> {
    return this.http
      .post(this.api_end_point, { dashboard: dashboard_name, query })
      .pipe(
        tap((res: ElasticsearchResponse) =>
          this.store.dispatch(new fromStore.GetDataSuccess(res, false)),
        ),
        map((d: ElasticsearchResponse) =>
          d.aggregations[this.source].buckets.map((year: Bucket) => +year.key),
        ),
      );
  }

  private httpGetMinAndMax(query: ElasticsearchQuery, dashboard_name) {
    return this.http
      .post(this.api_end_point, { dashboard: dashboard_name, query })
      .pipe(
        tap((res: ElasticsearchResponse) =>
          this.store.dispatch(new fromStore.GetDataSuccess(res, false)),
        ),
        map((d: ElasticsearchResponse) => {
          const obj = {};
          obj[`min_${this.source}`] = d.aggregations[`min_${this.source}`];
          obj[`max_${this.source}`] = d.aggregations[`max_${this.source}`];
          return obj;
        }),
      );
  }
}
