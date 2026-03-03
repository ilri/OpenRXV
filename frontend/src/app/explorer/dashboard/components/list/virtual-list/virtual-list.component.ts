import {
  Component,
  Input,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  Output,
  EventEmitter,
} from '@angular/core';
import { Bucket } from 'src/app/explorer/filters/services/interfaces';
import * as fromStore from '../../../../store';
import { Store } from '@ngrx/store';
import { ScreenSizeService } from 'src/app/explorer/services/screenSize/screen-size.service';
import { SelectService } from 'src/app/explorer/filters/services/select/select.service';
import { ParentComponent } from 'src/app/explorer/parent-component.class';
import {
  ComponentDashboardConfigs,
  SourceLevel,
} from 'src/app/explorer/configs/generalConfig.interface';
import { ActivatedRoute } from '@angular/router';
import { NgStyle, DecimalPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import {
  CdkVirtualScrollViewport,
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
} from '@angular/cdk/scrolling';
import { MatList, MatListItem, MatListItemLine } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-virtual-list',
  templateUrl: './virtual-list.component.html',
  styleUrls: ['./virtual-list.component.scss'],
  providers: [SelectService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatList,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    MatListItem,
    MatListItemLine,
    MatIcon,
    MatTooltip,
    NgStyle,
    DecimalPipe,
  ],
})
export class VirtualListComponent extends ParentComponent implements OnInit {
  private readonly store = inject<Store<fromStore.AppState>>(Store);
  private readonly screenSizeService = inject(ScreenSizeService);
  readonly selectService = inject(SelectService);
  activeRoute = inject(ActivatedRoute);

  @Input() listData: Bucket[];
  @Input() level: number = 0;
  @Input() sourceString: string = '';
  @Output() filteredChange = new EventEmitter<string>();
  totalItems: number;
  expandedItems: { [key: string]: boolean } = {};
  source: SourceLevel[];
  dashboard_name: string;

  get isSmall(): boolean {
    return this.screenSizeService.isSmallScreen;
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.store
      .select<number>(fromStore.getTotal)
      .subscribe((total: number) => (this.totalItems = total));
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    this.source = source;
  }
  toggleExpand(item: Bucket, event: Event) {
    event.stopPropagation();
    this.expandedItems[item.key] = !this.expandedItems[item.key];
  }

  isExpanded(item: Bucket): boolean {
    return !!this.expandedItems[item.key];
  }

  itemClicked(value, filtered: string) {
    if (
      this.componentConfigs.allowFilterOnClick != undefined &&
      this.componentConfigs.allowFilterOnClick != false
    ) {
      this.filteredChange.emit(filtered);
      const query: bodybuilder.Bodybuilder =
        this.selectService.addNewValueAttributetoMainQuery(filtered, value);
      const dashboard_name =
        this.dashboard_name ??
        this.activeRoute.snapshot.paramMap.get('dashboard_name');

      this.store.dispatch(
        new fromStore.SetQuery({
          dashboard: dashboard_name ? dashboard_name : 'DEFAULT_DASHBOARD',
          body: query.build(),
        }),
      );
      this.selectService.resetNotification();
    }
  }

  hasNested(b: Bucket): boolean {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    if (this.level >= source.length - 1) return false;

    const nextLevelIndex = this.level + 1;
    const nextLevelSource = source[nextLevelIndex];
    let nextLevelAggName = nextLevelSource.field + '_level_' + nextLevelIndex;
    nextLevelAggName = b[nextLevelAggName]
      ? nextLevelAggName
      : nextLevelSource.field + '.keyword_level_' + nextLevelIndex;
    const subBuckets = b[nextLevelAggName]
      ? b[nextLevelAggName].buckets
      : b.buckets
        ? b.buckets
        : [];

    return subBuckets && subBuckets.length > 0;
  }

  getNestedBuckets(b: Bucket): Bucket[] {
    const { source } = this.componentConfigs as ComponentDashboardConfigs;
    const nextLevelIndex = this.level + 1;
    const nextLevelSource = (source as SourceLevel[])[nextLevelIndex];
    let nextLevelAggName = nextLevelSource.field + '_level_' + nextLevelIndex;
    nextLevelAggName = b[nextLevelAggName]
      ? nextLevelAggName
      : nextLevelSource.field + '.keyword_level_' + nextLevelIndex;
    return b[nextLevelAggName]
      ? b[nextLevelAggName].buckets
      : b.buckets
        ? b.buckets
        : [];
  }

  handleFilteredChange(filtered: string) {
    this.filteredChange.emit(filtered);
  }
}
