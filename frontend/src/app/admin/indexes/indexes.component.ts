import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SettingsService } from '../services/settings.service';
import { FormIndexComponent } from './form/form.component';
import { ToastrService } from 'ngx-toastr';
import { ConfirmationComponent } from '../components/confirmation/confirmation.component';

@Component({
  selector: 'app-indexes',
  templateUrl: './indexes.component.html',
  styleUrls: ['./indexes.component.scss'],
})
export class IndexesComponent implements OnInit {
  constructor(
    private settingsService: SettingsService,
    public dialog: MatDialog,
    private toastr: ToastrService,
  ) {}
  indexes: any;
  form: FormGroup = new FormGroup({
    indexes: new FormArray([]),
  });

  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'created_at',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  openDialog() {
    const dialogRef = this.dialog.open(FormIndexComponent, {
      width: '30%',
      data: { event: 'New', body: {} },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.ngOnInit();
    });
  }

  async deleteIndex(id) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to delete this index?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const index = this.indexes
          .map((x) => {
            return x.id;
          })
          .indexOf(id);
        const deletedId = this.indexes[index].hasOwnProperty('id') && this.indexes[index].id != null ? this.indexes[index].id : null;
        const response = await this.settingsService.saveIndexesSettings(this.indexes, false, deletedId);

        if (response.success === true) {
          this.indexes.splice(index, 1);
          this.dataSource = new MatTableDataSource<any>(this.indexes);
          this.toastr.success('Index deleted successfully');
        } else {
          const relatedDashboards = response.relatedDashboards.map((dashboard) => {
            return `<li><b>ID: </b>${dashboard.id.substring(0, 2)}, <b>Name: </b>${dashboard.name}</li>`;
          });
          this.toastr.error(`Index is linked to the following dashboards and cannot be deleted:<ul>${relatedDashboards.join('')}</ul>`, '', {
            enableHtml: true
          });
        }
      }
    });
  }

  editIndex(id) {
    const dialogRef = this.dialog.open(FormIndexComponent, {
      width: '30%',
      data: { event: 'Edit', body: this.indexes.filter((x) => x.id == id) },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      let indexes = await this.settingsService.readIndexesSettings();
      this.indexes = indexes;
      this.dataSource = new MatTableDataSource<any>(indexes);
      this.dataSource.paginator = this.paginator;
      this.form.patchValue(indexes);
    });
  }
  async ngOnInit() {
    let indexes = await this.settingsService.readIndexesSettings();
    this.indexes = indexes;
    this.dataSource = new MatTableDataSource<any>(indexes);
    this.dataSource.paginator = this.paginator;
    this.form.patchValue(indexes);
  }
}
