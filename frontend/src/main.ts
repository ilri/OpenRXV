import { enableProdMode, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { environment } from './environments/environment';
import { ISO_8601_date_format, tokenGetter } from './app/app.module';
import { ExplorerModule } from './app/explorer/explorer.module';
import { RootComponent } from './app/root/root.component';
import { JwtModule } from '@auth0/angular-jwt';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ToastrModule } from 'ngx-toastr';
import { AppRoutingModule } from './app/app.routing.module';
import { CommonModule } from '@angular/common';
import { AdminModule } from './app/admin/admin.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { HttpClient, withInterceptorsFromDi, provideHttpClient } from '@angular/common/http';
import { agmConfigFactory } from './app/explorer/services/agm';
import { DateAdapter, NativeDateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { CommonService } from './app/common.service';

class PickDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: string): string {
    if (displayFormat === 'input') {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString();
      const day = date.getDate().toString();
      return (
        year +
        '-' +
        (month.length === 1 ? `0${month}` : month) +
        '-' +
        (day.length === 1 ? `0${day}` : day)
      );
    } else {
      return date.toDateString();
    }
  }
}
const year = date.getFullYear();
const month = (date.getMonth() + 1).toString();
const day = date.getDate().toString();



if (environment.production) {
  enableProdMode();
}

bootstrapApplication(RootComponent, {
    providers: [
        importProvidersFrom(BrowserModule, ExplorerModule, AdminModule, CommonModule, AppRoutingModule, ToastrModule.forRoot(), NgxSpinnerModule.forRoot({ type: 'ball-8bits' }), JwtModule.forRoot({
            config: {
                tokenGetter: tokenGetter,
                allowedDomains: ['localhost:3000'],
                disallowedRoutes: ['example.com/examplebadroute/'],
            },
        })),
        CommonService,
        { provide: DateAdapter, useClass: PickDateAdapter },
        { provide: MAT_DATE_FORMATS, useValue: ISO_8601_date_format },
        {
            provide: APP_INITIALIZER,
            useFactory: agmConfigFactory,
            deps: [HttpClient],
            multi: true,
        },
        provideHttpClient(withInterceptorsFromDi()),
    ]
})
  .catch((err) => console.error(err));
