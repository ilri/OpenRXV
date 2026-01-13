import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable, MatColumnDef, MatHeaderCellDef, MatHeaderCell, MatCellDef, MatCell, MatHeaderRowDef, MatHeaderRow, MatRowDef, MatRow } from '@angular/material/table';
import { SettingsService } from '../services/settings.service';
import { FormDashboardsComponent } from './form/form.component';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationComponent } from '../components/confirmation/confirmation.component';
import { CommonService } from '../../common.service';
import { RouterLinkActive, RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor, MatButton, MatIconButton, MatIconAnchor } from '@angular/material/button';
import { MatCard, MatCardTitle } from '@angular/material/card';

@Component({
    selector: 'app-indexes-dashboard',
    templateUrl: './indexes-dashboard.component.html',
    styleUrls: ['./indexes-dashboard.component.scss'],
    imports: [
        MatCard,
        MatCardTitle,
        MatAnchor,
        MatIcon,
        MatButton,
        MatTable,
        MatColumnDef,
        MatHeaderCellDef,
        MatHeaderCell,
        MatCellDef,
        MatCell,
        MatTooltip,
        MatIconButton,
        MatIconAnchor,
        RouterLinkActive,
        RouterLink,
        MatHeaderRowDef,
        MatHeaderRow,
        MatRowDef,
        MatRow,
        MatPaginator,
    ]
})
export class IndexesDashboardComponent implements OnInit {
  private settingsService = inject(SettingsService);
  dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);
  private commonService = inject(CommonService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  dashboards: any;
  exportLink: string;
  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'index',
    'created_at',
    'is_default',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  form: FormGroup = new FormGroup({
    dashboards: new FormArray([]),
  });
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  openDialog() {
    const defaultDashboard = this.dashboards.find((x) => x?.is_default);
    const dialogRef = this.dialog.open(FormDashboardsComponent, {
      width: '30%',
      data: {
        event: 'New',
        body: {},
        defaultDashboard: defaultDashboard?.name,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.refreshData();
    });
  }

  deleteDashboard(id) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to delete this dashboard?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.spinner.show();
        const dashboard = this.dashboards
          .map((x) => {
            return x.id;
          })
          .indexOf(id);
        this.dashboards.splice(dashboard, 1);
        const defaultDashboard = this.dashboards.find((x) => x?.is_default);
        await this.settingsService.saveDashboardsSettings(
          this.dashboards,
          false,
          defaultDashboard?.name,
        );
        await this.spinner.hide();
        this.toastr.success('Dashboard deleted successfully');
        this.refreshData();
      }
    });
  }

  editDashboard(id) {
    const defaultDashboard = this.dashboards.find((x) => x?.is_default);
    const dialogRef = this.dialog.open(FormDashboardsComponent, {
      width: '30%',
      data: {
        event: 'Edit',
        body: this.dashboards.filter((x) => x.id == id),
        defaultDashboard: defaultDashboard?.name,
      },
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
    const dashboards = await this.settingsService.readDashboardsSettings();
    this.dashboards = dashboards;
    this.dataSource = new MatTableDataSource<any>(dashboards);
    this.dataSource.paginator = this.paginator;
    this.form.patchValue(dashboards);
    this.updateExportLink(dashboards);
    await this.spinner.hide();
  }

  updateExportLink(dashboards) {
    const dashboardsCopy = JSON.parse(JSON.stringify(dashboards)).map(
      (dashboard) => {
        for (const key in dashboard) {
          if (dashboard.hasOwnProperty(key)) {
            if (
              (dashboard[key] != null &&
                (typeof dashboard[key] === 'object' ||
                  Array.isArray(dashboard[key]))) ||
              key === 'is_default'
            ) {
              delete dashboard[key];
            }
          }
        }
        return dashboard;
      },
    );
    this.exportLink =
      'data:text/json;charset=UTF-8,' +
      encodeURIComponent(JSON.stringify(dashboardsCopy));
  }

  async importJSON(event) {
    await this.spinner.show();
    const data: [] = await this.commonService.importJSON(event);
    const importStatus = {
      failed: [],
      success: [],
    };

    const availableIndexes = await this.settingsService.readIndexesSettings();
    const indexesIds = availableIndexes.map((index) => index.id);

    for (let i = 0; i < data.length; i++) {
      const importedItem = data[i] as any;
      const dashboardName = this.commonService.cleanIdNames(importedItem?.name);

      if (dashboardName === '') {
        const message = 'Dashboard #' + (i + 1) + ' cannot have empty name';
        importStatus.failed.push(message);
        continue;
      }
      if (!indexesIds.includes(importedItem?.index)) {
        const message = `${dashboardName} linked index ${importedItem?.index} doesn't exist`;
        importStatus.failed.push(message);
        continue;
      }
      const item = {
        name: dashboardName,
        index: importedItem.index,
        description: importedItem?.description,
      };

      const defaultDashboard = importedItem?.is_default
        ? dashboardName
        : this.dashboards.find((x) => x?.is_default)?.name;
      const response = await this.settingsService.saveDashboardsSettings(
        item,
        true,
        defaultDashboard,
      );
      if (response.success === true) {
        importStatus.success.push(dashboardName);
      } else {
        const message =
          dashboardName +
          ', failed to import with error: ' +
          (response?.message ? response.message : 'Oops! something went wrong');
        importStatus.failed.push(message);
      }
    }

    await this.spinner.hide();
    const message = this.commonService.importJSONResponseMessage(
      importStatus,
      data.length,
      'Dashboard(s)',
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

  async setAsDefault(defaultDashboard: string, isDefault: boolean) {
    if (isDefault) {
      this.toastr.warning(`This dashboard is the default dashboard`);
      return;
    }
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to set this dashboard as default?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.spinner.show();
        const response =
          await this.settingsService.setDashboardAsDefault(defaultDashboard);
        await this.spinner.hide();
        if (response.success) {
          this.toastr.success(response.message);
        } else {
          this.toastr.error(
            response?.message ? response.message : 'Oops! something went wrong',
          );
        }
        await this.refreshData();
      }
    });
  }
}
