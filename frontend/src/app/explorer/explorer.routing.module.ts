import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExplorerComponent } from './explorer.component';
import { LoginComponent } from '../admin/login/login.component';

const routes: Routes = [
  { path: '', component: ExplorerComponent },
  { path: 'login', component: LoginComponent },
  { path: 'shared/:id', component: ExplorerComponent },
  { path: ':dashboard_name', component: ExplorerComponent },
  { path: ':dashboard_name/shared/:id', component: ExplorerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExplorerRoutingModule {}
