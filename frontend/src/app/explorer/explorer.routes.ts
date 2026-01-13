import { Routes } from '@angular/router';

export const explorerRoutes: Routes = [
  { path: 'login', loadComponent: () => import('../admin/login/login.component').then(m => m.LoginComponent) },
  { path: 'shared/:id', loadComponent: () => import('./explorer.component').then(m => m.ExplorerComponent) },
  { path: ':dashboard_name/shared/:id', loadComponent: () => import('./explorer.component').then(m => m.ExplorerComponent) },
  { path: ':dashboard_name', loadComponent: () => import('./explorer.component').then(m => m.ExplorerComponent) },
  { path: '', loadComponent: () => import('./explorer.component').then(m => m.ExplorerComponent) },
];
