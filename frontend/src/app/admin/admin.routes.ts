import { Routes } from '@angular/router';
import {RootComponent} from "./root/root.component";
import {IndexesComponent} from "./indexes/indexes.component";
import {AdminGuard} from "./admin.guard";
import {DashboardComponent} from "./dashboard/dashboard.component";
import {MappingValuesComponent} from "./components/mapping-values/mapping-values.component";
import {SetupComponent} from "./components/setup/setup.component";
import {PluginsComponent} from "./plugins/plugins.component";
import {IndexesDashboardComponent} from "./indexes-dashboard/indexes-dashboard.component";
import {AppearanceComponent} from "./appearance/appearance.component";
import {DesignComponent} from "./design/design.component";
import {ReportingComponent} from "./reporting/reporting.component";
import {SharedComponent} from "./components/shared/shared.component";
import {UsersComponent} from "./components/users/users.component";

export const adminRoutes: Routes = [
  {
    path: 'admin',
    component: RootComponent,
    children: [
      {
        path: '',
        component: IndexesComponent,
        canActivate: [AdminGuard],
      },
      {
        path: 'indexes',
        component: IndexesComponent,
        canActivate: [AdminGuard],
      },
      {
        path: 'harvester/:index_name',
        component: DashboardComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'mapping-values/:index_name',
        component: MappingValuesComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'setup/:index_name',
        component: SetupComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'plugins/:index_name',
        component: PluginsComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'indexes-dashboards',
        component: IndexesDashboardComponent,
        canActivate: [AdminGuard],
      },
      {
        path: 'appearance/:dashboard_name',
        component: AppearanceComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'design/:dashboard_name',
        component: DesignComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'reporting/:dashboard_name',
        component: ReportingComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'sharedlinks/:dashboard_name',
        component: SharedComponent,
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [AdminGuard],
      },
    ],
  }
];
