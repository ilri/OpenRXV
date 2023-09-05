import { EventEmitter, Directive } from '@angular/core';
import {
  ComponentDashboardConfigs,
  ComponentFilterConfigs,
  MergedSelect,
} from 'src/app/explorer/configs/generalConfig.interface';
import { ChartMathodsService } from './services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { SelectService } from '../../filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../store';
import { ActivatedRoute } from '@angular/router';

@Directive()
export class ParentChart extends ParentComponent {
  chartOptions: Highcharts.Options;
  protected buildOptions: EventEmitter<Array<Bucket> | MergedSelect>;
  constructor(
    public readonly cms: ChartMathodsService,
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>,
    public activeRoute: ActivatedRoute,
  ) {
    super();
    this.buildOptions = new EventEmitter<Array<Bucket>>();
    this.chartOptions = {};
  }

  protected init(type: string, cb?: () => any) {
    this.cms.init(type, this.componentConfigs as ComponentDashboardConfigs, cb);
    this.cms.goBuildDataSeries.subscribe((bu: Bucket[] | MergedSelect) => {
      if (bu.length == 0) this.cms.setExpanded = false;
      else {
        this.cms.setExpanded = true;
      }
      this.buildOptions.emit(bu);
    });
  }

  private checkExpandedForObject(bu: MergedSelect): boolean {
    const arr: Array<Bucket> = [];
    for (const key in bu) {
      if (bu.hasOwnProperty(key)) {
        arr.push(...bu[key]);
      }
    }
    return arr.length >= 1;
  }
  Query(name: any) {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    const query: bodybuilder.Bodybuilder =
      this.selectService.addNewValueAttributetoMainQuery(source, name);
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');

    this.store.dispatch(
      new fromStore.SetQuery({
        dashboard: dashboard_name ? dashboard_name : 'index',
        body: query.build(),
      }),
    );
    this.selectService.resetNotification();
  }
  resetQ() {
    const { source } = this.componentConfigs as ComponentFilterConfigs;

    const query: bodybuilder.Bodybuilder =
      this.selectService.resetValueAttributetoMainQuery(source);
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');

    this.store.dispatch(
      new fromStore.SetQuery({
        dashboard: dashboard_name ? dashboard_name : 'index',
        body: query.build(),
      }),
    );
    setTimeout(() => {
      this.selectService.resetNotification();
    }, 5000);
  }
  setQ() {
    const _self = this;
    return function (e: any) {
      _self.Query(this.name);
    };
  }
}
