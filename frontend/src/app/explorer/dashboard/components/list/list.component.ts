import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ComponentDashboardConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import {
  Bucket,
  Hits,
  hits,
} from 'src/app/explorer/filters/services/interfaces';
import { PageEvent } from '@angular/material/paginator';
import { ScrollHelperService } from '../services/scrollTo/scroll-helper.service';
import { first } from 'rxjs/operators';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { ActivatedRoute } from '@angular/router';
import { PaginatedListComponent } from './paginated-list/paginated-list.component';
import { VirtualListComponent } from './virtual-list/virtual-list.component';
import { IconsWithTextComponent } from '../../representationalComponents/icons-with-text/icons-with-text.component';
import { CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { NgxSpinnerComponent } from 'ngx-spinner';

/**
 * declare is used to tell TypeScript compiler that the variable has been created elsewhere.
 * If you use declare, nothing is added to the JavaScript that is generated - it is simply a hint to the compiler.
 * For example, if you use an external script that defines var externalModule, you would use declare var
 * externalModule to hint to the TypeScript compiler that externalModule has already been set up
 */
declare function _altmetric_embed_init(): any;
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ScrollHelperService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatExpansionPanel,
    MatIcon,
    MatTooltip,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    IconsWithTextComponent,
    VirtualListComponent,
    PaginatedListComponent,
    NgxSpinnerComponent,
  ],
})
export class ListComponent extends ParentComponent implements OnInit {
  readonly store = inject<Store<fromStore.AppState>>(Store);
  readonly scrollHelperService = inject(ScrollHelperService);
  readonly cdr = inject(ChangeDetectorRef);
  private readonly selectService = inject(SelectService);
  private activeRoute = inject(ActivatedRoute);

  @ViewChild('clickToEnable') clickToEnable: ElementRef;
  hits: Hits; // for the paginated list
  listData: Bucket[]; // for aggrigiation list
  isPaginatedList: boolean; // determine if we should display the hits or not
  paginationAtt: PageEvent;
  filtered: string[] = [];
  popoverIsOpen = false;
  sourceString: string = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    super();
  }
  resetQ() {
    if (this.filtered.length === 0) return;

    let query: bodybuilder.Bodybuilder;
    this.filtered.map((filtered) => {
      query = this.selectService.resetValueAttributetoMainQuery(filtered);
    });
    this.filtered = [];
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');

    this.store.dispatch(
      new fromStore.SetQuery({
        dashboard: dashboard_name ? dashboard_name : 'DEFAULT_DASHBOARD',
        body: query.build(),
      }),
    );
    this.selectService.resetNotification();
  }
  ngOnInit(): void {
    this.scrollHelperService.storeVal = this.store;
    this.seeIfThisCompInView();
    this.scrollHelperService.dataIsReadyArrived
      .pipe(first())
      .subscribe(() => this.subToDataFromStore());
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
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const isMultiLevel = Array.isArray(source) && source.length > 1;
    this.sourceString = source?.[0]?.field;

    if (this.shouldWePaginate(this.sourceString)) {
      this.store.select(fromStore.getHits).subscribe((h: Hits) => {
        this.initPagination(h);
        this.cdr.detectChanges();
        this.expandOrStay(this.safeCheckLength(h && h.hits));
      });
    } else {
      this.store
        .select(
          isMultiLevel ? fromStore.getNestedBuckets : fromStore.getBuckets,
          this.componentConfigs.id,
        )
        .subscribe((b: Bucket[]) => {
          this.handleListData(b);
        });
    }

    this.store.select(fromStore.getLoadingOnlyHits).subscribe((b: boolean) => {
      this.loadingHits = b;
      this.cdr.detectChanges();
    });
  }

  private handleListData(b: Bucket[]) {
    this.listData = b;
    this.cdr.detectChanges();
    this.expandOrStay(this.safeCheckLength(b));
  }

  private initPagination(h: Hits): void {
    if (
      h &&
      h.total.value !== (this.paginationAtt && this.paginationAtt.length)
    ) {
      this.createPageEvent(h.total.value);
    }
    this.isPaginatedList = true;
    this.hits = h;
    setTimeout(() => _altmetric_embed_init(), 500);
  }

  private createPageEvent(total: number): void {
    this.paginationAtt = new PageEvent();
    this.paginationAtt.length = total;
    this.paginationAtt.pageSize = 10;
    this.paginationAtt.pageIndex = 0;
    this.paginationAtt.previousPageIndex = 0;
  }

  private shouldWePaginate(source: string | undefined): boolean {
    // undefined is for the paginated list and the source will be hits
    return !source;
  }

  private expandOrStay(length: number): void {
    this.scrollHelperService.expandedVal = length >= 1;
  }

  /**
   * To make sure the console won't log errors,
   * if there is no data. see `expandOrStay` &
   * `getFromStoreForOnce`
   */
  private safeCheckLength(arr: Array<Bucket> | Array<hits> | boolean): number {
    if (typeof arr === 'boolean') {
      return 0;
    }
    const len: number | boolean = arr && arr.length;
    return len || 0;
  }

  handleFilteredChange(filtered: string) {
    this.filtered.push(filtered);
  }
}
