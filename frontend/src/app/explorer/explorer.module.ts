import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ExplorerComponent } from './explorer.component';
import { StoreModule } from '@ngrx/store';
import { reducers, efficts } from 'src/app/explorer/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../../environments/environment';
import { EffectsModule } from '@ngrx/effects';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FiltersComponent } from './filters/filters.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from './filters/select/select.component';
import { PortalModule } from '@angular/cdk/portal';
import { DynamicComponent } from './dashboard/components/dynamic/dynamic.component';
import { LabelComponent } from './filters/label/label.component';
import { CounterComponent } from './dashboard/components/counter/counter.component';
import { SearchComponent } from './filters/search/search.component';
import { NouisliderModule } from 'ng2-nouislider';
import { RangeComponent } from './filters/range/range.component';
import { ScrollToComponent } from './dashboard/components/scroll-to/scroll-to.component';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';
import { InViewportModule } from '@thisissoon/angular-inviewport';
import { HighchartsChartModule } from 'highcharts-angular';
import { ChartComponent } from './dashboard/components/chart/chart.component';
import { ListComponent } from './dashboard/components/list/list.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { PaginatedListComponent } from './dashboard/components/list/paginated-list/paginated-list.component';
import { PubImageComponent } from './dashboard/components/list/paginated-list/pub-image/pub-image.component';
import { LinkTextComponent } from './dashboard/components/list/paginated-list/link-text/link-text.component';
import { VirtualListComponent } from './dashboard/components/list/virtual-list/virtual-list.component';
// tslint:disable-next-line
import { FilterPaginatedListComponent } from './dashboard/components/list/paginated-list/filter-paginated-list/filter-paginated-list.component';
import { NgxLoadingModule } from 'ngx-loading';
import { FooterComponent } from './dashboard/components/footer/footer.component';
import { TourMatMenuModule } from 'ngx-tour-md-menu';
import { WelcomeComponent } from './dashboard/representationalComponents/welcome/welcome.component';
import { MdePopoverModule } from '@material-extended/mde';
import { IconsWithTextComponent } from './dashboard/representationalComponents/icons-with-text/icons-with-text.component';
import { IconTextLoopComponent } from './dashboard/representationalComponents/icons-with-text/icon-text-loop/icon-text-loop.component';
import { TagsComponent } from './dashboard/components/list/paginated-list/link-text/tags/tags.component';
import { SnackComponent } from './dashboard/representationalComponents/snack/snack.component';
import { PieComponent } from './dashboard/components/pie/pie.component';
import { WordcloudComponent } from './dashboard/components/wordcloud/wordcloud.component';
import { MapComponent } from './dashboard/components/map/map.component';
import { GetFirstImage } from './pipes/images.pipe';
import { SafeHtmlPipe } from './pipes/safeHtml.pipe';
import { LineComponent } from './dashboard/components/line/line.component';
import { SimiCircleComponent } from './dashboard/components/simi-circle/simi-circle.component';
import { BarComponent } from './dashboard/components/bar/bar.component';
import { LayoutModule } from '@angular/cdk/layout';
import { ExportComponent } from './dashboard/components/list/export/export.component';
import { ExplorerRoutingModule } from './explorer.routing.module';
import { ShareComponent } from './share/share.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MainListComponent } from './dashboard/components/list/main-list/main-list.component';
import { WheelComponent } from './dashboard/components/wheel/wheel.component';
import { PackedBubbleComponent } from './dashboard/components/packed-bubble/packed-bubble.component';
import { PackedBubbleSplitComponent } from './dashboard/components/packed-bubble-split/packed-bubble-split.component';
import { DateRangeComponent } from './filters/date-range/date-range.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RotatedLablesComponent } from './dashboard/components/bar/rotated-lables/rotated-lables.component';
import { GooglemapsComponent } from './dashboard/components/googlemaps/googlemaps.component';
import { AgmCoreModule, LAZY_MAPS_API_CONFIG, MapsAPILoader } from '@agm/core';
import { AgmSnazzyInfoWindowModule } from '@agm/snazzy-info-window';
import { agmConfigFactory } from './services/agm';
// for HttpClient import:
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
// for Router import:
import { LoadingBarRouterModule } from '@ngx-loading-bar/router';
@NgModule({
  declarations: [
    ExplorerComponent,
    FiltersComponent,
    DashboardComponent,
    SelectComponent,
    DynamicComponent,
    ChartComponent,
    LabelComponent,
    CounterComponent,
    SearchComponent,
    RangeComponent,
    ScrollToComponent,
    ListComponent,
    PubImageComponent,
    LinkTextComponent,
    PaginatedListComponent,
    VirtualListComponent,
    FilterPaginatedListComponent,
    FooterComponent,
    WelcomeComponent,
    IconsWithTextComponent,
    IconTextLoopComponent,
    TagsComponent,
    SnackComponent,
    PieComponent,
    WheelComponent,
    PackedBubbleComponent,
    PackedBubbleSplitComponent,
    WordcloudComponent,
    DateRangeComponent,
    MapComponent,
    GetFirstImage,
    SafeHtmlPipe,
    LineComponent,
    SimiCircleComponent,
    BarComponent,
    ExportComponent,
    ShareComponent,
    MainListComponent,
    RotatedLablesComponent,
    GooglemapsComponent,
  ],
  imports: [
        // for HttpClient use:
        LoadingBarHttpClientModule,
        // for Router use:
        LoadingBarRouterModule,
    BrowserAnimationsModule,
    HttpClientModule,
    BrowserModule,
    FormsModule,
    NgSelectModule,
    PortalModule,
    MatSidenavModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatExpansionModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    InViewportModule,
    ScrollToModule.forRoot(),
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot(efficts),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode,
    }),
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatListModule,
    HighchartsChartModule,
    ScrollingModule,
    MatPaginatorModule,
    NgxLoadingModule.forRoot({}),
    MatRippleModule,
    MatProgressBarModule,
    NouisliderModule,
    TourMatMenuModule.forRoot(),
    ExplorerRoutingModule, // for TourMatMenuModule,
    MdePopoverModule, // https://github.com/angular/material2/issues/2691
    MatSnackBarModule,
    MatProgressSpinnerModule,
    LayoutModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    ClipboardModule,
    AgmCoreModule.forRoot({
      apiKey: 'initial api key',
    }),
    AgmSnazzyInfoWindowModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: agmConfigFactory,
      deps: [HttpClient, LAZY_MAPS_API_CONFIG],
      multi: true,
    },
  ],
})
export class ExplorerModule {}
