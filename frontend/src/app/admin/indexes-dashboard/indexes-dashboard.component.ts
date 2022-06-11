import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SettingsService } from '../services/settings.service';
import { FormDashboardsComponent } from './form/form.component';

@Component({
  selector: 'app-indexes-dashboard',
  templateUrl: './indexes-dashboard.component.html',
  styleUrls: ['./indexes-dashboard.component.scss']
})
export class IndexesDashboardComponent implements OnInit {

  constructor(
    private settingsService: SettingsService,
    public dialog: MatDialog
  ) { }

  dashboards: any;
  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'index',
    'created_at',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  form: FormGroup = new FormGroup({
    dashboards: new FormArray([]),
  });
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;


  openDialog() {
    const dialogRef = this.dialog.open(FormDashboardsComponent, {
      width: '30%',
      data: {event: 'New', body: {}},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.ngOnInit();
    });
  }

  deleteDashboard(id) {
    var dashboard = this.dashboards.map(x => {
      return x.id;
    }).indexOf(id);
    this.dashboards.splice(dashboard, 1);
    this.dataSource = new MatTableDataSource<any>(this.dashboards);
    this.settingsService.saveDashboardsSettings(this.dashboards, false);
  }

  editDashboard(id) {
    const dialogRef = this.dialog.open(FormDashboardsComponent, {
      width: '30%',
      data: {event: 'Edit', body: this.dashboards.filter(x => x.id == id)},
    });

    dialogRef.afterClosed().subscribe( async (result) => {
      let dashboards = await this.settingsService.readDashboardsSettings();
      console.log("dashboards", dashboards)
      this.dashboards = dashboards;
      this.dataSource = new MatTableDataSource<any>(dashboards);
      this.dataSource.paginator = this.paginator;
      this.form.patchValue(dashboards);
    });
  }

  async ngOnInit() {
    let dashboards = await this.settingsService.readDashboardsSettings();
    
    console.log("dashboards", dashboards)
    this.dashboards = dashboards;
    this.dataSource = new MatTableDataSource<any>(dashboards);
    this.dataSource.paginator = this.paginator;
    this.form.patchValue(dashboards);
  }

}
