import { Component, OnInit, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-info-table',
  templateUrl: './info-table.component.html',
  styleUrls: ['./info-table.component.scss'],
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
    'processedOn',
    'repo',
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
        'processedOn',
        'name',
        'attemptsMade',
      ];
  }

  ngAfterViewInit() {
    this._dataSource.paginator = this.paginator;
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
