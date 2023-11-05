import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminRoutingModule } from './admin.routing.module';
import { RootComponent } from './root/root.component';
import { BrowserModule } from '@angular/platform-browser';
import { LoginComponent } from './login/login.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UsersComponent } from './components/users/users.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { DemoMaterialModule } from 'src/app/material/material.module';
import { FormIndexComponent } from './indexes/form/form.component';
import { FormDashboardsComponent } from './indexes-dashboard/form/form.component';

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './auth/token.interceptor';
import { ConfirmationComponent } from './components/confirmation/confirmation.component';
import { MappingValuesComponent } from './components/mapping-values/mapping-values.component';
import { ValuesForm } from './components/mapping-values/form/values-form.component';
import { SetupComponent } from './components/setup/setup.component';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
import { SharedComponent } from './components/shared/shared.component';
import { DesignComponent } from './design/design.component';
import { CounterComponent } from './design/components/counter/counter.component';
import { FilterComponent } from './design/components/filter/filter.component';
import { StructureComponent } from './design/components/structure/structure.component';
import { FormDialogComponent } from './design/components/form-dialog/form-dialog.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { GridComponent } from './design/components/grid/grid.component';
import { AppearanceComponent } from './appearance/appearance.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { SortComponent } from './design/components/sort/sort.component';
import { MainListComponent } from './design/components/main-list/main-list.component';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { InfoTableComponent } from './dashboard/info-table/info-table.component';
import { PluginsComponent } from './plugins/plugins.component';
import { PluginComponent } from './plugins/plugin/plugin.component';
import { ReportingComponent } from './reporting/reporting.component';
import { ReprotingFormComponent } from './reporting/reproting-form/reproting-form.component';
import { DialogComponent } from './reporting/dialog/dialog.component';
import { DocComponent } from './reporting/doc/doc.component';
import { IndexesComponent } from './indexes/indexes.component';
import { IndexesDashboardComponent } from './indexes-dashboard/indexes-dashboard.component';
import { FormComponent } from './components/users/form/form.component';
@NgModule({
  declarations: [
    DashboardComponent,
    RootComponent,
    LoginComponent,
    UsersComponent,
    FormComponent,
    FormIndexComponent,
    FormDashboardsComponent,
    ConfirmationComponent,
    MappingValuesComponent,
    ValuesForm,
    SetupComponent,
    SharedComponent,
    DesignComponent,
    CounterComponent,
    FilterComponent,
    StructureComponent,
    FormDialogComponent,
    GridComponent,
    AppearanceComponent,
    SortComponent,
    MainListComponent,
    InfoTableComponent,
    PluginsComponent,
    PluginComponent,
    ReportingComponent,
    ReprotingFormComponent,
    DialogComponent,
    DocComponent,
    IndexesComponent,
    IndexesDashboardComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    CommonModule,
    DemoMaterialModule,
    AdminRoutingModule,
    LoadingBarHttpClientModule,
    LoadingBarRouterModule,
    NgSelectModule,
    ColorPickerModule,
    EditorModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
  ],
})
export class AdminModule {}
