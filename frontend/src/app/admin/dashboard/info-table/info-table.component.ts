import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

@Component({
  selector: 'app-info-table',
  templateUrl: './info-table.component.html',
  styleUrls: ['./info-table.component.scss'],
})
export class InfoTableComponent implements OnInit {
  @Input() plugin = false;
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
    this._dataSource.paginator = this.paginator;
  }
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
}
