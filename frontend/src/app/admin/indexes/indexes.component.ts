import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SettingsService } from '../services/settings.service';
import { FormIndexComponent } from './form/form.component';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationComponent } from '../components/confirmation/confirmation.component';
import { CommonService } from '../../common.service';
import * as dayjs from 'dayjs';

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
    private spinner: NgxSpinnerService,
    private commonService: CommonService,
  ) {}
  indexes: any;
  form: FormGroup = new FormGroup({
    indexes: new FormArray([]),
  });
  exportLink: string;

  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'created_at',
    'last_update',
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
        await this.spinner.show();
        const index = this.indexes
          .map((x) => {
            return x.id;
          })
          .indexOf(id);
        const deleted = this.indexes.splice(index, 1)[0];
        const response = await this.settingsService.saveIndexesSettings(
          this.indexes,
          false,
          deleted,
        );
        await this.spinner.hide();

        if (response.success === true) {
          this.dataSource = new MatTableDataSource<any>(this.indexes);
          this.toastr.success('Index deleted successfully');
          this.exportLink =
            'data:text/json;charset=UTF-8,' +
            encodeURIComponent(JSON.stringify(this.indexes));
        } else {
          this.indexes.splice(index, 0, deleted);
          const relatedDashboards = response.relatedDashboards.map(
            (dashboard) => {
              return `<li><b>ID: </b>${dashboard.id.substring(
                0,
                2,
              )}, <b>Name: </b>${dashboard.name}</li>`;
            },
          );
          const relatedRepositories = response.relatedRepositories.map(
            (repository) => {
              return `<li><b>Name: </b>${repository.name}</li>`;
            },
          );

          let message = '';
          if (relatedDashboards.length > 0) {
            message += `- Linked dashboards:<ul>${relatedDashboards.join(
              '',
            )}</ul>`;
          }
          if (relatedRepositories.length > 0) {
            message += `- Linked repositories:<ul>${relatedRepositories.join(
              '',
            )}</ul>`;
          }
          this.toastr.error(message, 'Index deletion failed', {
            enableHtml: true,
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
      if (result) this.refreshData();
    });
  }
  async ngOnInit() {
    this.refreshData();
  }

  async refreshData() {
    await this.spinner.show();
    const indexes = await this.settingsService.readIndexesSettings();
    this.indexes = indexes;
    this.dataSource = new MatTableDataSource<any>(indexes);
    this.dataSource.paginator = this.paginator;
    this.form.patchValue(indexes);
    this.exportLink =
      'data:text/json;charset=UTF-8,' +
      encodeURIComponent(JSON.stringify(indexes));
    await this.spinner.hide();
  }

  async importJSON(event) {
    await this.spinner.show();
    const data: [] = await this.commonService.importJSON(event);
    const importStatus = {
      failed: [],
      success: [],
    };
    for (let i = 0; i < data.length; i++) {
      const importedItem = data[i] as any;
      const indexName = this.commonService.cleanIdNames(importedItem?.name);
      if (indexName !== '') {
        const item = {
          name: indexName,
          description: importedItem?.description,
          to_be_indexed: importedItem?.to_be_indexed,
          auto_harvest: importedItem?.auto_harvest,
          interval: importedItem?.interval,
          interval_month: importedItem?.interval_month,
          interval_month_day: importedItem?.interval_month_day,
          interval_week_day: importedItem?.interval_week_day,
          interval_hour: importedItem?.interval_hour,
          interval_minute: importedItem?.interval_minute,
          created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        };
        const response = await this.settingsService.saveIndexesSettings(
          item,
          true,
          null,
        );
        if (response.success === true) {
          importStatus.success.push(indexName);
        } else {
          const message =
            indexName +
            ', failed to import with error: ' +
            (response?.message
              ? response.message
              : 'Oops! something went wrong');
          importStatus.failed.push(message);
        }
      } else {
        const message = 'Index #' + (i + 1) + ' cannot have empty name';
        importStatus.failed.push(message);
      }
    }

    await this.spinner.hide();
    const message = this.commonService.importJSONResponseMessage(
      importStatus,
      data.length,
      'Index(es)',
    );
    if (message.type === 'success') {
      this.toastr.success(message.message, null, { enableHtml: true });
      this.refreshData();
    } else if (message.type === 'warning') {
      this.toastr.warning(message.message, null, { enableHtml: true });
      this.refreshData();
    } else {
      this.toastr.error(message.message, null, { enableHtml: true });
    }
  }
}
