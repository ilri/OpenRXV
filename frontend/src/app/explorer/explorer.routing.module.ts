import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExplorerComponent } from './explorer.component';

const routes: Routes = [
  { path: '', component: ExplorerComponent },
  { path: 'shared/:id', component: ExplorerComponent },
  { path: ':dashboard_name', component: ExplorerComponent },
  { path: ':dashboard_name/shared/:id', component: ExplorerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExplorerRoutingModule {}
