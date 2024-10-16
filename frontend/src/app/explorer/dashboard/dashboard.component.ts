import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromStore from '../store';
import { SetQuery } from '../store';
import { MainBodyBuilderService } from '../services/mainBodyBuilderService/main-body-builder.service';
import { ESHttpError } from 'src/app/explorer/store/actions/actions.interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackComponent } from './representationalComponents/snack/snack.component';
import {
  GeneralConfigs,
  ComponentDashboardConfigs,
} from 'src/app/explorer/configs/generalConfig.interface';
import { ItemsService } from '../services/itemsService/items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SettingsService } from 'src/app/admin/services/settings.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  dashboardConfig: Array<GeneralConfigs> = [];
  countersConfig: Array<GeneralConfigs> = [];
  tourConfig: Array<GeneralConfigs> = [];
  oldViewState: Map<string, boolean>;
  dashboard_name: string;

  constructor(
    private readonly store: Store<fromStore.AppState>,
    private readonly mainBodyBuilderService: MainBodyBuilderService,
    private readonly snackBar: MatSnackBar,
    private readonly itemsService: ItemsService,
    private activeRoute: ActivatedRoute,
    private settingsService: SettingsService,
    private route: Router,
  ) {
    this.oldViewState = new Map<string, boolean>();
  }
  async getCounters() {
    const settings = await this.settingsService.readExplorerSettings(
      this.dashboard_name ? this.dashboard_name : undefined,
    );
    this.dashboardConfig = settings.dashboard.flat(1);
    this.tourConfig = [settings.welcome];

    await localStorage.setItem('configs', JSON.stringify(settings));
    this.countersConfig = settings.counters;
    [this.countersConfig[0], ...this.dashboardConfig].forEach(
      ({ componentConfigs }: GeneralConfigs) =>
        this.oldViewState.set(
          (componentConfigs as ComponentDashboardConfigs).id,
          false,
        ),
    );
  }
  async ngOnInit() {
    this.dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    await this.getCounters();
    const shareID = this.activeRoute.snapshot.paramMap.get('id');
    if (shareID) {
      try {
        const shareitem: any = await this.itemsService.getShare(
          shareID,
          this.dashboard_name,
        );
        if (shareitem) {
          this.mainBodyBuilderService.setOrOperator = shareitem?.operator;

          const sprateObjects = Object.keys(shareitem.attr).map(function (key) {
            const obj = {};
            obj[key] = shareitem.attr[key];
            return obj;
          });
          sprateObjects.forEach((item: any) => {
            this.mainBodyBuilderService.setAggAttributes = item;
          });
        } else this.route.navigate(['admin/indexes']);
      } catch (e) {
        this.route.navigate(['admin/indexes']);
      }
    }

    setTimeout(() => {
      this.store.dispatch(
        new SetQuery({
          dashboard: this.dashboard_name,
          body: this.mainBodyBuilderService.buildMainQuery(0).build(),
        }),
      );
    }, 300);

    this.store.select(fromStore.getErrors).subscribe((e: ESHttpError) => {
      if (e) {
        this.snackBar.openFromComponent(SnackComponent).instance.error =
          e.error;
      }
    });
  }

  onInViewportChange(inViewport: boolean, id: string): void {
    const [realId, linkedWith] = id.split('.');
    if (
      this.oldViewState.has(realId) &&
      this.oldViewState.get(realId) !== inViewport
    ) {
      this.oldViewState.set(realId, inViewport);
      this.store.dispatch(
        new fromStore.SetInView({
          viewState: {
            userSeesMe: inViewport,
            linkedWith: linkedWith === 'undefined' ? realId : linkedWith,
          },
          id: realId,
        }),
      );
    }
  }
}
