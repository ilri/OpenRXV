import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SharedService } from '../../services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconAnchor } from '@angular/material/button';
import { MatCard, MatCardTitle } from '@angular/material/card';

@Component({
    selector: 'app-shared',
    templateUrl: './shared.component.html',
    styleUrls: ['./shared.component.scss'],
    imports: [
        MatCard,
        MatCardTitle,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatIconAnchor,
        MatTooltip,
        MatIcon,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        MatPaginator,
        JsonPipe,
    ]
})
export class SharedComponent implements OnInit {
  currenRoute: any;

  constructor(
    private sharedService: SharedService,
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
  ) {}

  displayedColumns: string[] = [
    'id',
    'created_at',
    'hashedItem',
    'attr',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  dashboard_name: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  async ngOnInit() {
    this.dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const mappingshared = await this.sharedService.getSharedLinks(
      this.dashboard_name,
    );
    this.dataSource = new MatTableDataSource<any>(mappingshared.hits);
    this.dataSource.paginator = this.paginator;
  }
  view(id) {
    window.open(
      `${location.origin}/explorer/dashboard/${this.dashboard_name}/shared/${id}`,
    );
  }
}
