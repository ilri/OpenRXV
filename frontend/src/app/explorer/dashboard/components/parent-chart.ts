import { EventEmitter, Directive, inject } from '@angular/core';
import {
  ComponentDashboardConfigs,
  MergedSelect,
  SourceLevel,
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
  readonly cms = inject(ChartMathodsService);
  readonly selectService = inject(SelectService);
  readonly store = inject<Store<fromStore.AppState>>(Store);
  activeRoute = inject(ActivatedRoute);

  chartOptions: Highcharts.Options;
  protected buildOptions: EventEmitter<Array<Bucket> | MergedSelect>;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
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

  Query(name: any, sourceString?: string) {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    sourceString = sourceString ?? (source[0] as SourceLevel).field;
    const query: bodybuilder.Bodybuilder =
      this.selectService.addNewValueAttributetoMainQuery(sourceString, name);
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');

    this.store.dispatch(
      new fromStore.SetQuery({
        dashboard: dashboard_name ? dashboard_name : 'DEFAULT_DASHBOARD',
        body: query.build(),
      }),
    );
    this.selectService.resetNotification();
  }
  resetQ(filtered?: string) {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    filtered = filtered ?? (source[0] as SourceLevel).field;
    const query: bodybuilder.Bodybuilder =
      this.selectService.resetValueAttributetoMainQuery(filtered);
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');

    this.store.dispatch(
      new fromStore.SetQuery({
        dashboard: dashboard_name ? dashboard_name : 'DEFAULT_DASHBOARD',
        body: query.build(),
      }),
    );
    setTimeout(() => {
      this.selectService.resetNotification();
    }, 5000);
  }
}
