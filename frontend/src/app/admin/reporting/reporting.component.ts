import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReprotingFormComponent } from './reproting-form/reproting-form.component';
import { DialogComponent } from './dialog/dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { SettingsService } from '../services/settings.service';
import { MetadataService } from '../services/metadata.service';
import { DocComponent } from './doc/doc.component';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { CommonService } from '../../common.service';
import { MatTooltip } from '@angular/material/tooltip';

import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardTitle } from '@angular/material/card';

@Component({
    selector: 'app-reporting',
    templateUrl: './reporting.component.html',
    styleUrls: ['./reporting.component.scss'],
    imports: [
        MatCard,
        MatCardTitle,
        MatAnchor,
        MatIcon,
        MatButton,
        MatMenuTrigger,
        MatMenu,
        MatMenuItem,
        MatTooltip,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatIconButton,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        MatPaginator
    ]
})
export class ReportingComponent implements OnInit {
  private settingsService = inject(SettingsService);
  dialog = inject(MatDialog);
  private metadataService = inject(MetadataService);
  private activeRoute = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);
  private commonService = inject(CommonService);

  reports: any;
  tableData = new MatTableDataSource<any>([]);
  fileName;
  dataSource: any;
  confirmation = false;
  dialogRef: MatDialogRef<any>;
  envireoment = environment.api;
  metadata: any;
  dashboard_name: string;
  exportLink: string;
  displayedColumns: string[] = ['title', 'fileType', 'actions'];
  allowedFileTypes = [
    {
      label: 'Excel',
      extension: 'xlsx',
    },
    {
      label: 'PDF',
      extension: 'pdf',
    },
    {
      label: 'Word',
      extension: 'docx',
    },
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  async ngOnInit() {
    this.dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    this.dataSource = await this.settingsService.retreiveMetadata;
    this.metadata = await this.metadataService.get(this.dashboard_name, null);
    await this.refreshData();
  }

  async refreshData() {
    await this.spinner.show();
    this.reports = await this.settingsService.readReports(this.dashboard_name);
    this.tableData = new MatTableDataSource<any>(this.reports);
    this.tableData.paginator = this.paginator;
    this.refreshExportLink();
    await this.spinner.hide();
  }

  refreshExportLink() {
    const reports = JSON.parse(JSON.stringify(this.reports)).map((report) => {
      if (report?.fileType !== 'xlsx' && report?.file) {
        report.file =
          location.origin + this.envireoment + '/settings' + report.file;
      }
      return report;
    });
    this.exportLink =
      'data:text/json;charset=UTF-8,' +
      encodeURIComponent(JSON.stringify(reports));
  }

  newReport() {
    const dialogRef = this.dialog.open(ReprotingFormComponent, {
      data: {
        dashboard_name: this.dashboard_name,
        form_data: { title: '', fileType: '', file: '' },
        reports: this.reports,
        index: -1,
        allowedFileTypes: this.allowedFileTypes,
      },
      width: '650px',
      height: '550px',
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.refreshData();
        this.toastr.success('Report saved successfully');
      }
    });
  }

  delete(index) {
    const dialog = this.dialog.open(DialogComponent, {
      data: {
        dashboard_name: this.dashboard_name,
        reportData: this.reports[index],
      },
    });
    dialog.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.spinner.show();
        this.reports.splice(index, 1);
        this.settingsService.saveReportsSettings(
          this.reports,
          this.dashboard_name,
        );
        await this.spinner.hide();
        this.toastr.success('Report deleted successfully');
        await this.refreshData();
      }
    });
  }

  edit(index) {
    this.dialogRef = this.dialog.open(ReprotingFormComponent, {
      data: {
        dashboard_name: this.dashboard_name,
        form_data: this.reports[index],
        reports: this.reports,
        index: index,
        allowedFileTypes: this.allowedFileTypes,
      },
      width: '650px',
      height: '550px',
    });
    this.dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.refreshData();
        this.toastr.success('Report saved successfully');
      }
    });
  }
  copyMessage(val: string) {
    const selBox = document.createElement('textarea');
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  showDoc() {
    const dialogRef = this.dialog.open(DocComponent, { width: '1300px' });
  }
  downloadfile(file) {
    this.settingsService.getFile(file);
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
      const item = {
        title: importedItem?.title.trim(),
        fileType: importedItem?.fileType.trim().toLowerCase(),
        tags: importedItem?.tags,
        file: importedItem?.file,
      };

      if (item.title === '' && importedItem.tags.length === 0) {
        const message = 'Report #' + (i + 1) + ' title cannot be empty';
        importStatus.failed.push(message);
        continue;
      }
      const allowedFileTypes = this.allowedFileTypes.map(
        (type) => type.extension,
      );
      if (!allowedFileTypes.includes(item.fileType)) {
        const message = 'Report #' + (i + 1) + ', invalid file type';
        importStatus.failed.push(message);
        continue;
      }
      if (item.fileType === 'xlsx') {
        item.file = item.title + '.xlxs';
        if (importedItem.tags.length === 0) {
          const message = 'Report #' + (i + 1) + ', has no data sources';
          importStatus.failed.push(message);
          continue;
        }
      }
      importStatus.success.push(item.title);

      this.reports.push(item);
    }

    await this.settingsService.saveReportsSettings(
      this.reports,
      this.dashboard_name,
    );

    await this.spinner.hide();
    const message = this.commonService.importJSONResponseMessage(
      importStatus,
      data.length,
      'Report(s)',
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
