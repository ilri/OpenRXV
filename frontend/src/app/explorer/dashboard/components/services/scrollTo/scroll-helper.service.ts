import { Injectable, ChangeDetectorRef } from '@angular/core';
import { ViewState } from 'src/app/explorer/store/reducers/items.reducer';
import { InView } from 'src/app/explorer/store/actions/actions.interfaces';
import { GeneralConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../../store';
import { ViewChild } from '../../list/paginated-list/filter-paginated-list/types.interface';

@Injectable()
export class ScrollHelperService {
  viewState: ViewState;
  private expanded: boolean;
  private store: Store<fromStore.ItemsState>;
  private children: Array<ViewChild>;
  countersConfig = [];
  dashboardConfig = [];
  dataIsReadyArrived: Subject<void>;
  loading: boolean;

  set storeVal(s: Store<fromStore.ItemsState>) {
    this.store = s;
  }

  set expandedVal(b: boolean) {
    this.expanded = b;
  }

  get expandedStatus(): boolean {
    return this.expanded;
  }

  get getViewState(): ViewState {
    return this.viewState;
  }

  get getLoading(): boolean {
    return this.loading;
  }

  constructor(private readonly cdr: ChangeDetectorRef) {
    this.expanded = true;
    this.dataIsReadyArrived = new Subject();
    const { counters, dashboard } = JSON.parse(localStorage.getItem('configs'));
    this.countersConfig = counters;
    this.dashboardConfig = dashboard.flat(1);
  }

  changeViewState(id: string, collapsed: boolean): InView {
    this.changeCollapsed(collapsed);
    return {
      id,
      viewState: this.viewState,
    };
  }

  getScrollToCompConf(): GeneralConfigs[] {
    return [this.countersConfig[0], ...this.dashboardConfig];
  }

  getChildren(): Array<ViewChild> {
    if (this.children) {
      return this.children;
    } else {
      const children: Array<ViewChild> = [];
      this.dashboardConfig.forEach(
        (d) =>
          d.scroll.linkedWith &&
          children.push({
            linkedId: d.scroll.linkedWith,
            compId: d.componentConfigs.id,
          }),
      );
      this.children = [...children];
      return children;
    }
  }

  /**
   * countersConfig[0] is where we get the id of
   * the counters components
   */
  getNotSiblings(): GeneralConfigs[] {
    return [
      this.countersConfig[0],
      ...this.dashboardConfig.filter(
        (gc: GeneralConfigs) => gc.scroll.icon && gc.show,
      ),
    ];
  }

  seeIfThisCompInView(id: string): void {
    this.store
      .select(fromStore.getInViewById, id)
      .subscribe((viewState: ViewState) => {
        if (viewState.userSeesMe) {
          this.subToLoaders();
          this.viewState = viewState;
        }
      });
  }

  subToLoaders(): void {
    if (this.loading !== undefined) {
      // sub only one time
      return;
    }
    this.store.select(fromStore.getLoadingStatus).subscribe((b: boolean) => {
      this.loading = b;
      this.cdr.detectChanges();
      if (!b) {
        this.dataIsReadyArrived.next();
      }
    });
    return;
  }

  disPatchSetInView(id: string, collapsed: boolean): void {
    this.store.dispatch(
      new fromStore.SetInView(this.changeViewState(id, collapsed)),
    );
  }

  private changeCollapsed(collapsed: boolean): void {
    this.viewState = { ...this.viewState, collapsed };
  }
}

export type componentIdWitSate = [string, ViewState];
