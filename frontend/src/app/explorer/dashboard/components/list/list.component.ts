import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromStore from '../../../store';
import { ComponentDashboardConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { Bucket, Hits, hits } from 'src/app/explorer/filters/services/interfaces';
import { PageEvent } from '@angular/material/paginator';
import { ScrollHelperService } from '../services/scrollTo/scroll-helper.service';
import { first } from 'rxjs/operators';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import { ComponentLookup } from '../dynamic/lookup.registry';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { BodyBuilderService } from 'src/app/explorer/filters/services/bodyBuilder/body-builder.service';

/**
 * declare is used to tell TypeScript compiler that the variable has been created elsewhere.
 * If you use declare, nothing is added to the JavaScript that is generated - it is simply a hint to the compiler.
 * For example, if you use an external script that defines var externalModule, you would use declare var
 * externalModule to hint to the TypeScript compiler that externalModule has already been set up
 */
declare function _altmetric_embed_init(): any;
@ComponentLookup('ListComponent')
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  providers: [ScrollHelperService, SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent extends ParentComponent implements OnInit {
  @ViewChild('clickToEnable') clickToEnable: ElementRef;
  hits: Hits; // for the paginated list
  listData: Bucket[]; // for aggrigiation list
  isPaginatedList: boolean; // determine if we should display the hits or not
  paginationAtt: PageEvent;
  filterd = false;
  constructor(
    public readonly store: Store<fromStore.AppState>,
    public readonly scrollHelperService: ScrollHelperService,
    public readonly cdr: ChangeDetectorRef,
    private readonly selectService: SelectService,
    private readonly bodyBuilderService:BodyBuilderService
  ) {
    super();
  }
  resetQ() {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    this.filterd = false;
    const query: bodybuilder.Bodybuilder = this.selectService.resetValueAttributetoMainQuery(source as string);
    this.store.dispatch(new fromStore.SetQuery(query.build()));
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
    const { source, size } = this.componentConfigs as ComponentDashboardConfigs;
    this.shouldWePaginate(source as string)
      ? this.store.select(fromStore.getHits).subscribe((h: Hits) => {
        this.initPagination(source as string, h);
        this.cdr.detectChanges();
        this.expandOrStay(this.safeCheckLength(h && h.hits));
      })
      : this.store
        .select(fromStore.getBuckets, size ? size + '_' + source : '10000_' + source)
        .subscribe((b: Bucket[]) => {
          const { source } = this.componentConfigs as ComponentDashboardConfigs;
          let filters = this.bodyBuilderService.getFiltersFromQuery().filter(element => Object.keys(element).indexOf(source +'.keyword') != -1)
          if (filters.length)
            this.filterd = true;
          else
            this.filterd = false;
          this.listData = b;
          this.cdr.detectChanges();
          this.expandOrStay(this.safeCheckLength(b));
        });
    this.store.select(fromStore.getLoadingOnlyHits).subscribe((b: boolean) => {
      this.loadingHits = b;
      this.cdr.detectChanges();
    });
  }

  private initPagination(source: string, h: Hits): void {
    if (h && h.total.value !== (this.paginationAtt && this.paginationAtt.length)) {
      this.createPageEvent(h.total.value);
    }
    this.isPaginatedList = this.shouldWePaginate(source);
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
    return !!!source;
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
}
