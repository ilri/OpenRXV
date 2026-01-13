import { Routes } from '@angular/router';
import {ExplorerComponent} from "./explorer.component";
import {LoginComponent} from "../admin/login/login.component";

export const explorerRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'shared/:id', component: ExplorerComponent },
  { path: ':dashboard_name/shared/:id', component: ExplorerComponent },
  { path: ':dashboard_name', component: ExplorerComponent },
  { path: '', component: ExplorerComponent },
];
