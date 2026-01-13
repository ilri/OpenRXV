import { Routes } from '@angular/router';
import {AdminGuard} from "./admin.guard";

export const adminRoutes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./root/root.component').then(m => m.RootComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./indexes/indexes.component').then(m => m.IndexesComponent),
        canActivate: [AdminGuard],
      },
      {
        path: 'indexes',
        loadComponent: () => import('./indexes/indexes.component').then(m => m.IndexesComponent),
        canActivate: [AdminGuard],
      },
      {
        path: 'harvester/:index_name',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'mapping-values/:index_name',
        loadComponent: () => import('./components/mapping-values/mapping-values.component').then(m => m.MappingValuesComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'setup/:index_name',
        loadComponent: () => import('./components/setup/setup.component').then(m => m.SetupComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'plugins/:index_name',
        loadComponent: () => import('./plugins/plugins.component').then(m => m.PluginsComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes' },
      },
      {
        path: 'indexes-dashboards',
        loadComponent: () => import('./indexes-dashboard/indexes-dashboard.component').then(m => m.IndexesDashboardComponent),
        canActivate: [AdminGuard],
      },
      {
        path: 'appearance/:dashboard_name',
        loadComponent: () => import('./appearance/appearance.component').then(m => m.AppearanceComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'design/:dashboard_name',
        loadComponent: () => import('./design/design.component').then(m => m.DesignComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'reporting/:dashboard_name',
        loadComponent: () => import('./reporting/reporting.component').then(m => m.ReportingComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'sharedlinks/:dashboard_name',
        loadComponent: () => import('./components/shared/shared.component').then(m => m.SharedComponent),
        canActivate: [AdminGuard],
        data: { parentRoute: 'indexes-dashboards' },
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent),
        canActivate: [AdminGuard],
      },
    ],
  }
];
