import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IndexesComponent } from './admin/indexes/indexes.component';

const routes: Routes = [
  { path: '**', component: IndexesComponent },
  { path: 'notfound', component: IndexesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
