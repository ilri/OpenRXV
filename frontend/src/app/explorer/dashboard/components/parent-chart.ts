import { EventEmitter } from '@angular/core';
import {
  ComponentDashboardConfigs,
  ComponentFilterConfigs,
  MergedSelect
} from 'src/app/explorer/configs/generalConfig.interface';
import { ChartMathodsService } from './services/chartCommonMethods/chart-mathods.service';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { SelectService } from '../../filters/services/select/select.service';
import { Store } from '@ngrx/store';
import * as fromStore from '../../store';

export class ParentChart extends ParentComponent {
  chartOptions: Highcharts.Options;
  protected buildOptions: EventEmitter<Array<Bucket> | MergedSelect>;
  constructor(public readonly cms: ChartMathodsService, 
    public readonly selectService: SelectService,
    public readonly store: Store<fromStore.AppState>) {
    super();
    this.buildOptions = new EventEmitter<Array<Bucket>>();
    this.chartOptions = {};
  }

  protected init(type: string, cb?: () => any) {
    this.cms.init(type, this.componentConfigs as ComponentDashboardConfigs, cb);
    this.cms.goBuildDataSeries.subscribe((bu: Bucket[] | MergedSelect) => {

      if (bu.length == 0)
        this.cms.setExpanded = false
      else {
        this.cms.setExpanded = true
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
    const query: bodybuilder.Bodybuilder = this.selectService.addNewValueAttributetoMainQuery(source, name);
    this.store.dispatch(new fromStore.SetQuery(query.build()));
    this.selectService.resetNotification();
  }
  resetQ() {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
   
    const query: bodybuilder.Bodybuilder = this.selectService.resetValueAttributetoMainQuery(source);
    this.store.dispatch(new fromStore.SetQuery(query.build()));
    setTimeout(() => {
      this.selectService.resetNotification();
    }, 5000);
   
  }
  setQ() {
    var _self = this;
    return function (e: any) {

      _self.Query(this.name)

    }

  }
}
