import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import * as fromStore from './store';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MainBodyBuilderService } from 'src/app/explorer/services/mainBodyBuilderService/main-body-builder.service';
import { TourService, IStepOption } from 'ngx-ui-tour-md-menu';
import {
  GeneralConfigs,
  ComponentCounterConfigs,
  ComponentDashboardConfigs,
  Tour,
} from 'src/app/explorer/configs/generalConfig.interface';
import { orAndToolTip } from 'src/app/explorer/configs/tooltips';
import { ScreenSizeService } from 'src/app/explorer/services/screenSize/screen-size.service';
import { ItemsService } from './services/itemsService/items.service';
import { ShareComponent } from './share/share.component';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { InViewState } from './store/reducers/items.reducer';
import { SetQuery } from './store';
import { FooterComponent } from './dashboard/components/footer/footer.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'explorer-root',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.scss'],
})
export class ExplorerComponent implements OnInit {
  @ViewChild('drawer') sidenav: MatDrawer;
  loading$: Observable<boolean>;
  render: boolean;
  shareID: string;
  logo: string;
  website_name: string;
  orOperator: boolean;
  primaryColorPalette;
  primaryColor;
  countersConfig = [];
  dashboardConfig = [];
  tourConfig = [];
  orAndToolTip: string;
  private prevenetMouseOnNav: boolean;
  options: any = {
    bottom: 0,
    fixed: true,
    top: 0,
  };
  dashboard_name: string;
  async share() {
    this.openDialog(
      location.href.match(/(.*)shared.*/)
        ? location.href.match(/(.*)shared.*/)[1]
        : location.origin +
            location.pathname +
            (await this.itemsService.saveShare(
              this.mainBodyBuilderService.getAggAttributes,
              this.dashboard_name,
              this.orOperator,
            )),
    );
  }
  get isSmall(): boolean {
    return this.screenSizeService.isSmallScreen;
  }

  constructor(
    private readonly store: Store<fromStore.AppState>,
    private readonly mainBodyBuilderService: MainBodyBuilderService,
    private readonly tourService: TourService,
    private readonly screenSizeService: ScreenSizeService,
    private readonly itemsService: ItemsService,
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
  ) {
    this.orOperator = false;
    this.orAndToolTip = orAndToolTip;
    this.options = {
      bottom: 0,
      fixed: true,
      top: 0,
    };
  }

  openDialog(link): void {
    const dialogRef = this.dialog.open(ShareComponent, {
      width: '600px',
      data: { link },
    });
  }
  appearance;
  index_last_update = null;
  async ngOnInit() {
    this.dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const { counters, dashboard, appearance, welcome, index_last_update } =
      await JSON.parse(localStorage.getItem('configs'));
    this.appearance = appearance;
    this.index_last_update = index_last_update;
    if (appearance.logo) this.logo = environment.api + '/' + appearance.logo;
    this.website_name = appearance.website_name;
    localStorage.setItem('primaryColor', appearance.primary_color);
    localStorage.setItem(
      'minColor',
      this.hexToHSL(localStorage.getItem('primaryColor'), 'min'),
    );
    localStorage.setItem(
      'midColor',
      this.hexToHSL(localStorage.getItem('primaryColor'), 'mid'),
    );
    localStorage.setItem('colors', JSON.stringify(appearance.chartColors));
    const inview = (() => {
      // creating the state dynamically
      const obj = Object.create(null);
      Object.values([counters[0], ...dashboard.flat(1)]).forEach(
        ({ componentConfigs }: GeneralConfigs) =>
          (obj[(componentConfigs as ComponentDashboardConfigs).id] = {
            collapsed: false,
            userSeesMe: false,
          }),
      );
      return obj;
    })() as InViewState;
    Object.keys(inview).forEach((id) => {
      this.store.dispatch(
        new fromStore.SetInView({
          id,
          viewState: inview[id],
        }),
      );
    });

    this.countersConfig = counters;
    this.dashboardConfig = dashboard.flat(1);
    this.tourConfig = [welcome];

    const itemsLabel = appearance.items_label;
    this.orAndToolTip = this.orAndToolTip.replaceAll('##ITEMS_LABEL_PLACEHOLDER##', itemsLabel ? itemsLabel : 'Information Products');

    this.loading$ = this.store.select(fromStore.getLoadingStatus);
  }
  hexToHSL(H, term) {
    // Convert hex to RGB first
    let r: any = 0,
      g: any = 0,
      b: any = 0;
    if (H.length == 4) {
      r = '0x' + H[1] + H[1];
      g = '0x' + H[2] + H[2];
      b = '0x' + H[3] + H[3];
    } else if (H.length == 7) {
      r = '0x' + H[1] + H[2];
      g = '0x' + H[3] + H[4];
      b = '0x' + H[5] + H[6];
    }
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
      cmax = Math.max(r, g, b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    if (term == 'min') l = +(l * 310).toFixed(1);
    else l = +(l * 155).toFixed(1);

    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.prevenetMouseOnNav) {
      if (event.x === 0 && !this.sidenav.opened) {
        this.openAndRender('over');
      }
      if (event.x > this.sidenav._getWidth() && this.sidenav.opened) {
        this.sidenav.close();
      }
    }
  }

  openNavAndDisableIgnoreMouseEvent(): void {
    this.openAndRender('over');
    this.prevenetMouseOnNav = true;
    this.sidenav.closedStart.subscribe(() => (this.prevenetMouseOnNav = false));
  }

  addRemoveOrOperator(): void {
    this.orOperator = !this.orOperator;
    this.mainBodyBuilderService.setOrOperator = this.orOperator;
  }

  refresh(): void {
    this.mainBodyBuilderService.resetAttributes();
    setTimeout(() => {
      this.store.dispatch(
        new SetQuery({
          dashboard: this.dashboard_name
            ? this.dashboard_name
            : 'DEFAULT_DASHBOARD',
          body: this.mainBodyBuilderService.buildMainQuery(0).build(),
        }),
      );
    }, 300);
  }

  startTour(): void {
    this.tourService.initialize(this.mapConfigsToTour());
    this.tourService.start();
  }

  private openAndRender(mode: 'over' | 'push' | 'side'): void {
    this.sidenav.mode = this.isSmall ? 'over' : mode;
    this.sidenav.opened ? this.sidenav.close() : this.sidenav.open();
    this.renderSideNav();
  }

  private mapConfigsToTour(): IStepOption[] {
    return [...this.tourConfig, ...this.countersConfig, ...this.dashboardConfig]
      .filter(({ show }: GeneralConfigs) => show)
      .map(({ componentConfigs, tour }: GeneralConfigs) => {
        const { description, title, id } = componentConfigs as
          | ComponentCounterConfigs
          | ComponentDashboardConfigs
          | Tour;
        return (
          tour &&
          this.checkIfApplicableForTour(id, description, title) &&
          ({
            anchorId: id,
            content: description,
            title,
            enableBackdrop: true,
            rout: id,
            closeOnOutsideClick: true,
            disablePageScrolling: true,
          } as IStepOption)
        );
      })
      .filter((iso: IStepOption) => Object.keys(iso).length >= 1);
  }
  seeAbout() {
    this.dialog.open(FooterComponent, { width: '2000px', maxHeight: '90vh' });
  }
  private checkIfApplicableForTour(
    id: string,
    content: string,
    title: string,
  ): boolean {
    return !!(id && content && title);
  }

  private renderSideNav(): void {
    if (this.render === undefined) {
      this.render = true;
    }
  }
}
