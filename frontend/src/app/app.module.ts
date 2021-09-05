import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExplorerModule } from './explorer/explorer.module';
import { AdminModule } from './admin/admin.module';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app.routing.module';
import { RootComponent } from './root/root.component';
import { JwtModule, JwtHelperService } from '@auth0/angular-jwt';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { ToastrModule } from 'ngx-toastr';
import { AgmCoreModule } from '@agm/core';
// for HttpClient import:
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
// for Router import:
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
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
    AgmCoreModule.forRoot({
      apiKey: 'NO API KEY PROVIDED',
    }),
    // for HttpClient use:
    LoadingBarHttpClientModule,

    // for Router use:
    LoadingBarRouterModule,
    ToastrModule.forRoot(),
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        whitelistedDomains: ['localhost:3000'],
        blacklistedRoutes: ['example.com/examplebadroute/'],
      },
    }),
  ],
  providers: [],
  bootstrap: [RootComponent],
})
export class AppModule {}
