import {
  Component,
  OnInit,
  Input,
  Output,
  ViewChild,
  EventEmitter,
} from '@angular/core';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow,
} from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-info-table',
  templateUrl: './info-table.component.html',
  styleUrls: ['./info-table.component.scss'],
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatIcon,
    MatTooltip,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    MatPaginator,
  ],
})
export class InfoTableComponent implements OnInit {
  @Input() plugin = false;
  @Input('pageIndex') pageIndex = 0;
  @Input('pageSize') pageSize = 5;
  @Input('totalPages') totalPages = 0;
  @Input('totalRecords') totalRecords = 0;
  displayedColumns: string[] = [
    'id',
    'page',
    'timestamp',
    'processedOn',
    'finishedOn',
    'repository_name',
    'attemptsMade',
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  private _dataSource: MatTableDataSource<Array<any>> = new MatTableDataSource<
    Array<any>
  >([]);

  @Input('data') set dataSource(value: MatTableDataSource<Array<any>>) {
    this._dataSource = value;
    setTimeout(() => {
      this.paginator.pageIndex = this.pageIndex;
      this.paginator.length = this.totalRecords;
    });
  }

  @Output() paginationEvent = new EventEmitter();

  get dataSource() {
    return this._dataSource;
  }

  constructor() {}

  async ngOnInit() {
    if (this.plugin)
      this.displayedColumns = [
        'id',
        'page',
        'timestamp',
        'processedOn',
        'finishedOn',
        'plugin_name',
        'attemptsMade',
      ];
  }

  paginationChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;

    this.paginationEvent.emit({
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
    });
  }
}
