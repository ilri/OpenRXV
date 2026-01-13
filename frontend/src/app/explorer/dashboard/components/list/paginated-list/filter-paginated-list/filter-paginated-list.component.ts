import { Component, EventEmitter, Output, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { SortOption } from 'src/app/explorer/configs/generalConfig.interface';
import { FileType } from './types.interface';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { ActivatedRoute } from '@angular/router';

import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
    selector: 'app-filter-paginated-list',
    templateUrl: './filter-paginated-list.component.html',
    styleUrls: ['./filter-paginated-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        NgSelectModule,
        FormsModule,
        MatIconButton,
        MatMenuTrigger,
        MatIcon,
        MatMenu,
        MatMenuItem
    ]
})
export class FilterPaginatedListComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private activeRoute = inject(ActivatedRoute);

  @Output() filterChanged: EventEmitter<SortOption>;
  @Output() startExporting: EventEmitter<any>;
  @Input() filterOptions: SortOption[];
  selectedFilter: SortOption;
  ascDesc: SortOption[];
  reverseOption: string;
  files: [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    this.filterChanged = new EventEmitter();
    this.startExporting = new EventEmitter();
  }

  async ngOnInit() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    this.ascDesc = [
      {
        display: 'Descending',
        value: 'desc',
      },
      {
        display: 'Ascending',
        value: 'asc',
      },
    ];
    this.selectedFilter = this.filterOptions[0];
    this.reverseOption = this.selectedFilter.sort;
    this.files = await this.settingsService.readReports(dashboard_name);
    this.filterChanged.emit(this.selectedFilter);
  }

  onFilterChanged(f: SortOption): void {
    this.reverseOption = f.sort;
    this.filterChanged.emit(f);
  }

  reverse(s: SortOption): void {
    this.filterOptions = this.filterOptions.map((sortOption: SortOption) => {
      sortOption.sort = s.value as 'asc' | 'desc';
      return sortOption;
    });
    this.onFilterChanged(this.selectedFilter);
  }

  startExportingNow(type: FileType, file): void {
    this.startExporting.emit({ type, file });
  }
}
