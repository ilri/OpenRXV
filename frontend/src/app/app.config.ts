import {
  enableProdMode,
  provideZoneChangeDetection,
  ApplicationConfig,
  Injectable,
  importProvidersFrom,
} from '@angular/core';

import { environment } from '../environments/environment';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { appRoutes } from './app.routes';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  NativeDateAdapter,
  provideNativeDateAdapter,
} from '@angular/material/core';
import dayjs from 'dayjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHighcharts } from 'highcharts-angular';
import { JwtModule } from '@auth0/angular-jwt';
import { CommonService } from './common.service';
import { TokenInterceptor } from './admin/auth/token.interceptor';
import { TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { efficts, reducers } from './explorer/store';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { provideUiTour } from 'ngx-ui-tour-md-menu';

export const ISO_8601_DATE_FORMAT = {
  parse: { dateInput: { month: 'short', year: 'numeric', day: 'numeric' } },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Injectable()
class PickDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: string): string {
    if (displayFormat === 'input') {
      return dayjs(date).format('YYYY-MM-DD');
    } else {
      return date.toDateString();
    }
  }
}

if (environment.production) {
  enableProdMode();
}

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),

    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideToastr(),
    provideNativeDateAdapter(),
    provideAnimationsAsync(),
    provideHighcharts({
      modules: () => {
        return [
          import('highcharts/esm/highcharts-more'),
          import('highcharts/esm/modules/accessibility'),
          import('highcharts/esm/modules/exporting'),
          import('highcharts/esm/modules/gantt'),
          import('highcharts/esm/modules/stock'),
          import('highcharts/esm/modules/sunburst'),
          import('highcharts/esm/modules/wordcloud'),
          import('highcharts/esm/modules/drilldown'),
          import('highcharts/esm/modules/map'),
          import('highcharts/esm/modules/boost'),
          import('highcharts/esm/modules/sankey'),
          import('highcharts/esm/modules/dependency-wheel'),
          import('highcharts/esm/modules/no-data-to-display'),
          import('highcharts/esm/modules/series-on-point'),
        ];
      },
    }),
    importProvidersFrom(
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
        },
      }),
    ),
    { provide: DateAdapter, useClass: PickDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: ISO_8601_DATE_FORMAT },
    CommonService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    { provide: TINYMCE_SCRIPT_SRC, useValue: 'tinymce/tinymce.min.js' },
    provideStore(reducers),
    provideEffects(efficts),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: false,
    }),
    importProvidersFrom(LoadingBarHttpClientModule),
    provideUiTour(),
  ],
};
