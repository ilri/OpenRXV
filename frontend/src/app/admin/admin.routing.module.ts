import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { RootComponent } from './root/root.component';
import { LoginComponent } from './login/login.component';
import { AdminGuard } from './admin.guard';
import { UsersComponent } from './components/users/users.component';
import { MappingValuesComponent } from './components/mapping-values/mapping-values.component';
import { SetupComponent } from './components/setup/setup.component';
import { SharedComponent } from './components/shared/shared.component';
import { DesignComponent } from './design/design.component';
import { AppearanceComponent } from './appearance/appearance.component';
import { PluginsComponent } from './plugins/plugins.component';
import { ReportingComponent } from './reporting/reporting.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: RootComponent,
    children: [
      { path: '', component: DashboardComponent, canActivate: [AdminGuard] },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [AdminGuard],
      },
      {
        path: 'appearance/:name',
        component: AppearanceComponent,
        canActivate: [AdminGuard],
      },
      { path: 'users', component: UsersComponent, canActivate: [AdminGuard] },
      { path: 'shared', component: SharedComponent, canActivate: [AdminGuard] },
      {
        path: 'mapping-values',
        component: MappingValuesComponent,
        canActivate: [AdminGuard],
      },
      { path: 'setup', component: SetupComponent, canActivate: [AdminGuard] },
      {
        path: 'plugins',
        component: PluginsComponent,
        canActivate: [AdminGuard],
      },
      { path: 'design/:name', component: DesignComponent, canActivate: [AdminGuard] },
      {
        path: 'reporting/:name',
        component: ReportingComponent,
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
