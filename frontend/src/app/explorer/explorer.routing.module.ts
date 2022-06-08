import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ExplorerComponent } from './explorer.component';
import { RootComponent } from '../root/root.component';

const routes: Routes = [
 
  { path: '', component: ExplorerComponent },
  { path: 'shared/:id', component: ExplorerComponent },
  { path: 'dashboard/:name', component: ExplorerComponent },
  { path: 'dashboard/:name/shared/:id', component: ExplorerComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ExplorerRoutingModule {}
