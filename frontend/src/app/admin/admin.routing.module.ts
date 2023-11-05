import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { RootComponent } from './root/root.component';
import { AdminGuard } from './admin.guard';
import { UsersComponent } from './components/users/users.component';
import { MappingValuesComponent } from './components/mapping-values/mapping-values.component';
import { SetupComponent } from './components/setup/setup.component';
import { SharedComponent } from './components/shared/shared.component';
import { DesignComponent } from './design/design.component';
import { AppearanceComponent } from './appearance/appearance.component';
import { PluginsComponent } from './plugins/plugins.component';
import { ReportingComponent } from './reporting/reporting.component';
import { IndexesComponent } from './indexes/indexes.component';
import { IndexesDashboardComponent } from './indexes-dashboard/indexes-dashboard.component';

const routes: Routes = [
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
        data: {parentRoute: 'indexes'},
      },
      {
        path: 'mapping-values/:index_name',
        component: MappingValuesComponent,
        canActivate: [AdminGuard],
        data: {parentRoute: 'indexes'},
      },
      {
        path: 'setup/:index_name',
        component: SetupComponent,
        canActivate: [AdminGuard],
        data: {parentRoute: 'indexes'},
      },
      {
        path: 'plugins/:index_name',
        component: PluginsComponent,
        canActivate: [AdminGuard],
        data: {parentRoute: 'indexes'},
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
        data: {parentRoute: 'indexes-dashboards'},
      },
      {
        path: 'design/:dashboard_name',
        component: DesignComponent,
        canActivate: [AdminGuard],
        data: {parentRoute: 'indexes-dashboards'},
      },
      {
        path: 'reporting/:dashboard_name',
        component: ReportingComponent,
        canActivate: [AdminGuard],
        data: {parentRoute: 'indexes-dashboards'},
      },
      {
        path: 'sharedlinks/:dashboard_name',
        component: SharedComponent,
        canActivate: [AdminGuard],
        data: {parentRoute: 'indexes-dashboards'},
      },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [AdminGuard],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
