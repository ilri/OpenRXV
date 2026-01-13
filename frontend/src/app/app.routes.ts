import { Routes } from '@angular/router';
import { NotfoundComponent } from './components/notfound/notfound.component';
import {adminRoutes} from "./admin/admin.routes";
import {explorerRoutes} from "./explorer/explorer.routes";

export const appRoutes: Routes = [
  { path: 'notfound', component: NotfoundComponent },
  ...adminRoutes,
  ...explorerRoutes,
  { path: '**', component: NotfoundComponent },
];
