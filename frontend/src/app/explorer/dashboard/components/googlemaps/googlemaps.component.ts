// import { AgmMap } from "@agm/core";
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Store } from '@ngrx/store';
import { first } from 'rxjs/operators';
import {
  ComponentDashboardConfigs,
  ComponentFilterConfigs,
} from 'src/app/explorer/configs/generalConfig.interface';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';
import {
  Hits,
  Bucket,
  hits,
} from 'src/app/explorer/filters/services/interfaces';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ScrollHelperService } from '../services/scrollTo/scroll-helper.service';
import * as fromStore from '../../../store';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { ChartMathodsService } from '../services/chartCommonMethods/chart-mathods.service';
import { ParentChart } from '../parent-chart';
import { AgmMap } from '@agm/core';
import { SettingsService } from 'src/app/admin/services/settings.service';

declare function _altmetric_embed_init(): any;
interface marker {
  lat: number;
  lng: number;
  label?: string;
  draggable: boolean;
}
@ComponentLookup('GoogleMapsComponent')
@Component({
  selector: 'app-google-maps',
  templateUrl: './googlemaps.component.html',
  providers: [ChartMathodsService, ScrollHelperService, SelectService],
  styleUrls: ['./googlemaps.component.scss'],
})
export class GooglemapsComponent extends ParentChart implements OnInit {
  @Input() expandedStatus: boolean;
  hits: Hits; // for the paginated list
  listData: Bucket[] = []; // for aggrigiation list
  isPaginatedList: boolean; // determine if we should display the hits or not
  paginationAtt: PageEvent;
  isFullscreen = false;
  fitBounds = false;
  refreshMap = true;
  filterd = false;
  myStyles = {
    height: '430px',
  };
  @ViewChild('agmmap') mapElement: any;
  timeout: any = [];
  // google maps zoom level
  zoom = 2;
  // initial center position for the map
  @ViewChild('clickToEnable') clickToEnable: ElementRef;
  @ViewChild('panel') elementView: ElementRef;
  constructor(
    cms: ChartMathodsService,
    public readonly store: Store<fromStore.AppState>,
    public readonly scrollHelperService: ScrollHelperService,
    public readonly selectService: SelectService,
    private readonly cdr: ChangeDetectorRef,
    private readonly bodyBuilderService: BodyBuilderService,
  ) {
    super(cms, selectService, store);
  }

  resetQ() {
    this.filterd = false;
    const query: bodybuilder.Bodybuilder =
      this.selectService.resetValueAttributetoMainQuery('id');
    this.store.dispatch(new fromStore.SetQuery(query.build()));
    this.selectService.resetNotification();
  }
  filterMarker(code) {
    this.filterd = true;
    const query: bodybuilder.Bodybuilder =
      this.selectService.addNewValueAttributetoMainQuery('id', code);
    this.store.dispatch(new fromStore.SetQuery(query.build()));
    this.selectService.resetNotification();
  }
  fullscren() {
    this.isFullscreen = !this.isFullscreen;
    this.refreshMap = false;
    setTimeout(() => {
      this.myStyles.height = this.elementView.nativeElement.offsetHeight
        ? this.elementView.nativeElement.offsetHeight - 65 + 'px'
        : '430px';
      this.refreshMap = true;
    }, 100);
  }

  makeChunks(markers) {
    if (markers.length >= 1000) markers = markers.slice(0, markers.length / 1);
    this.scrollHelperService.loading = true;
    let i,
      j,
      temparray = [],
      chunk = 75;
    for (i = 0, j = markers.length; i < j; i += chunk) {
      temparray.push(markers.slice(i, i + chunk));
    }
    return temparray;
  }
  loopThroughMarkersText(chunks) {
    const markers = this.makeChunks(chunks);
    for (let i = 0; i < markers.length; i++) {
      ((i) => {
        this.timeout.push(
          setTimeout(() => {
            for (let z = 0; z < markers[i].length; z++) {
              this.listData.push(markers[i][z]);
            }
            if (i == markers.length - 1)
              this.scrollHelperService.loading = false;
          }, 1000 * i),
        );
      })(i);
    }
  }

  ngOnInit(): void {
    this.init('google-maps');
    this.scrollHelperService.storeVal = this.store;
    this.seeIfThisCompInView();
    this.subToDataFromStore();
  }

  hideClickToEnable(): void {
    this.clickToEnable.nativeElement.hidden = true;
  }

  disPatchSetInView(collapsed: boolean): void {
    const { id } = this.componentConfigs as ComponentDashboardConfigs;
    this.scrollHelperService.disPatchSetInView(id, collapsed);
  }

  @HostListener('mouseleave', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (this.clickToEnable) {
      this.clickToEnable.nativeElement.hidden = false;
    }
  }

  private seeIfThisCompInView(): void {
    const { id } = this.componentConfigs as ComponentDashboardConfigs;
    this.scrollHelperService.seeIfThisCompInView(id);
  }

  private subToDataFromStore(): void {
    const { source } = this.componentConfigs as ComponentFilterConfigs;
    this.buildOptions.subscribe((buckets: Array<Bucket>) => {
      const filters = this.bodyBuilderService
        .getFiltersFromQuery()
        .filter(
          (element) => Object.keys(element).indexOf(source + '.keyword') != -1,
        );
      if (filters.length) this.filterd = true;
      else this.filterd = false;
      this.timeout.forEach((element) => {
        clearTimeout(element);
      });
      this.zoom = 8;
      this.fitBounds = true;
      this.listData = [];
      this.loopThroughMarkersText(buckets);

      this.cdr.detectChanges();
    });
  }

  private safeCheckLength(arr: Array<Bucket> | Array<hits> | boolean): number {
    if (typeof arr === 'boolean') {
      return 0;
    }
    const len: number | boolean = arr && arr.length;
    return len || 0;
  }
}
