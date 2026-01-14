import { Routes } from '@angular/router';
import { adminRoutes } from './admin/admin.routes';
import { explorerRoutes } from './explorer/explorer.routes';

export const appRoutes: Routes = [
  {
    path: 'notfound',
    loadComponent: () =>
      import('./components/notfound/notfound.component').then(
        (m) => m.NotfoundComponent,
      ),
  },
  ...adminRoutes,
  ...explorerRoutes,
  {
    path: '**',
    loadComponent: () =>
      import('./components/notfound/notfound.component').then(
        (m) => m.NotfoundComponent,
      ),
  },
];
