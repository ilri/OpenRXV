import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromStore from '../store';
import { SetQuery } from '../store';
import { BodyBuilderService } from '../filters/services/bodyBuilder/body-builder.service';
import { ESHttpError } from 'src/app/explorer/store/actions/actions.interfaces';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackComponent } from './representationalComponents/snack/snack.component';
import {
  GeneralConfigs,
  ComponentDashboardConfigs,
} from 'src/app/explorer/configs/generalConfig.interface';
import { ItemsService } from '../services/itemsService/items.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MainBodyBuilderService } from '../services/mainBodyBuilderService/main-body-builder.service';
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

  constructor(
    private readonly store: Store<fromStore.AppState>,
    private readonly bodyBuilderService: BodyBuilderService,
    private readonly snackBar: MatSnackBar,
    private readonly itemsService: ItemsService,
    private activeRoute: ActivatedRoute,
    private settingsService: SettingsService,
    private route: Router,
  ) {
    this.oldViewState = new Map<string, boolean>();
  }
  async getCounters() {
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    let settings = await this.settingsService.readExplorerSettings(
      dashboard_name ? dashboard_name : undefined,
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
    await this.getCounters();
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    let shareID = this.activeRoute.snapshot.paramMap.get('id');
    if (shareID) {
      try {
        let shareitem: any = await this.itemsService.getShare(shareID);
        if (shareitem) {
          let sprateObjects = Object.keys(shareitem.attr).map(function (key) {
            let obj = {};
            obj[key] = shareitem.attr[key];
            return obj;
          });
          sprateObjects.forEach((item: any) => {
            this.bodyBuilderService.setAggAttributes = item;
          });
        } else this.route.navigate(['notfound']);
      } catch (e) {
        this.route.navigate(['notfound']);
      }
    }
    this.store.dispatch(
      new SetQuery({
        dashboard: dashboard_name,
        body: this.bodyBuilderService.buildMainQuery().build(),
      }),
    );

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
