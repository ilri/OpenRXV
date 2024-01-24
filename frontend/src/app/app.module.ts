import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExplorerModule } from './explorer/explorer.module';
import { AdminModule } from './admin/admin.module';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app.routing.module';
import { RootComponent } from './root/root.component';
import { JwtModule } from '@auth0/angular-jwt';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { ToastrModule } from 'ngx-toastr';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CommonService } from './common.service';
import {
  DateAdapter,
  NativeDateAdapter,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { formatDate } from '@angular/common';
// for HttpClient import:
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
// for Router import:
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';

export const ISO_8601_date_format = {
  parse: { dateInput: { month: 'short', year: 'numeric', day: 'numeric' } },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

class PickDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: string): string {
    if (displayFormat === 'input') {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString();
      const day = (date.getDate()).toString();
      return year + '-' + (month.length === 1 ? `0${month}` : month) + '-' + (day.length === 1 ? `0${day}` : day);
    } else {
      return date.toDateString();
    }
  }
}

export function tokenGetter() {
  return localStorage.getItem('access_token');
}
@NgModule({
  declarations: [RootComponent, NotfoundComponent],
  imports: [
    BrowserModule,
    ExplorerModule,
    AdminModule,
    CommonModule,
    AppRoutingModule,
    ToastrModule.forRoot(),
    NgxSpinnerModule.forRoot({ type: 'ball-8bits' }),
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ['localhost:3000'],
        disallowedRoutes: ['example.com/examplebadroute/'],
      },
    }),
  ],
  providers: [
    CommonService,
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: ISO_8601_date_format },
  ],
  bootstrap: [RootComponent],
})
export class AppModule {}
