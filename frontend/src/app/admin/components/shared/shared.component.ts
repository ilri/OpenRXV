import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { SharedService } from '../../services/shared.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-shared',
  templateUrl: './shared.component.html',
  styleUrls: ['./shared.component.scss'],
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
