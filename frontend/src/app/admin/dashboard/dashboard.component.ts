import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationComponent } from '../components/confirmation/confirmation.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private setttingService: SettingsService,
    private activeRoute: ActivatedRoute,
    public dialog: MatDialog,
    private toastr: ToastrService,
    ) {}

  fetchData = {
    active_count: 0,
    waiting_count: 0,
    completed_count: 0,
    failed_count: 0,
    stuck_count: 0,
    table: {
      data: new MatTableDataSource<Array<any>>([]),
      pageIndex: 0,
      pageSize: 5,
      totalPages: 0,
      totalRecords: 0,
    }
  }
  pluginsData = {
    active_count: 0,
    waiting_count: 0,
    completed_count: 0,
    failed_count: 0,
    stuck_count: 0,
    table: {
      data: new MatTableDataSource<Array<any>>([]),
      pageIndex: 0,
      pageSize: 5,
      totalPages: 0,
      totalRecords: 0,
    }
  }

  pagination = {
    fetch: {
      pageIndex: 0,
      pageSize: 5,
    },
    plugins: {
      pageIndex: 0,
      pageSize: 5,
    },
  };
  fetchActiveTable = 'Active';
  fetchActiveStatus = 'active';
  pluginsActiveTable = 'Active';
  pluginsActiveStatus = 'active';
  refreshCounter = {
    fetch: {
      counter: 0,
      interval: null
    },
    plugins: {
      counter: 0,
      interval: null
    }
  };

  index_name: string;

  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    this.Init();
  }

  async startHarvesting() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to start harvesting?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const response = await this.setttingService.startHarvesting(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          this.refreshCounter.fetch.counter = this.refreshCounter.plugins.counter = 0;
          await this.Init();
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async commitIndex() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to commit the index?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const response = await this.setttingService.commitIndex(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          this.refreshCounter.fetch.counter = this.refreshCounter.plugins.counter = 0;
          await this.Init();
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async startPlugins() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to start plugins?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const response = await this.setttingService.startPlugins(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          this.refreshCounter.plugins.counter = 0;
          await this.InitPluginsData(this.pluginsActiveStatus);
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async stopHarvesting() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to stop harvesting?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const response = await this.setttingService.stopHarvesting(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          this.refreshCounter.fetch.counter = this.refreshCounter.plugins.counter = 0;
          this.Init();
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async Init() {
    await this.InitFetchData(this.fetchActiveStatus);
    await this.InitPluginsData(this.pluginsActiveStatus);
  }

  async InitFetchData(status: string = null, paginationRefresh: boolean = false) {
    const {
      active_count,
      waiting_count,
      completed_count,
      failed_count,
      stuck_count,
      table,
    } = await this.setttingService.getHarvesterInfo(this.index_name, 'fetch', status, this.pagination.fetch);

    this.fetchData.active_count = active_count;
    this.fetchData.waiting_count = waiting_count;
    this.fetchData.completed_count = completed_count;
    this.fetchData.failed_count = failed_count;
    this.fetchData.stuck_count = stuck_count;
    this.fetchData.table = {
      data: new MatTableDataSource<Array<any>>(table.data),
      pageIndex: table.pageIndex,
      pageSize: table.pageSize,
      totalPages: table.totalPages,
      totalRecords: table.totalRecords,
    };
    if (this.fetchData.active_count == 0 && this.fetchData.active_count == 0 && this.refreshCounter.fetch.counter >= 3) {
      if (this.refreshCounter.fetch.interval != null) {
        clearInterval(this.refreshCounter.fetch.interval);
        this.refreshCounter.fetch.interval = null;
      }
    }

    if (this.refreshCounter.fetch.counter == 0) {
      if (!this.refreshCounter.fetch.interval)
        this.refreshCounter.fetch.interval = setInterval(() => {
          this.InitFetchData(this.fetchActiveStatus);
        }, 6000);
    }

    if (!paginationRefresh) {
      this.refreshCounter.fetch.counter++;
    }
  }

  async InitPluginsData(status: string = null, paginationRefresh: boolean = false) {
    const {
      active_count,
      waiting_count,
      completed_count,
      failed_count,
      stuck_count,
      table,
    } = await this.setttingService.getHarvesterInfo(this.index_name, 'plugins', status, this.pagination.plugins);

    this.pluginsData.active_count = active_count;
    this.pluginsData.waiting_count = waiting_count;
    this.pluginsData.completed_count = completed_count;
    this.pluginsData.failed_count = failed_count;
    this.pluginsData.stuck_count = stuck_count;
    this.pluginsData.table = {
      data: new MatTableDataSource<Array<any>>(table.data),
      pageIndex: table.pageIndex,
      pageSize: table.pageSize,
      totalPages: table.totalPages,
      totalRecords: table.totalRecords,
    };
    if (this.pluginsData.active_count == 0 && this.pluginsData.active_count == 0 && this.refreshCounter.plugins.counter >= 3) {
      if (this.refreshCounter.plugins.interval != null) {
        clearInterval(this.refreshCounter.plugins.interval);
        this.refreshCounter.plugins.interval = null;
      }
    }

    if (this.refreshCounter.plugins.counter == 0) {
      if (!this.refreshCounter.plugins.interval)
        this.refreshCounter.plugins.interval = setInterval(() => {
          this.InitPluginsData(this.pluginsActiveStatus);
        }, 6000);
    }

    if (!paginationRefresh) {
      this.refreshCounter.plugins.counter++;
    }
  }

  async PaginationChanged(event: PageEvent, status: string, section: string) {
    if (this.pagination.hasOwnProperty(section)) {
      this.pagination[section].pageSize = event.pageSize;
      this.pagination[section].pageIndex = event.pageIndex;
      if (section === 'fetch') {
        await this.InitFetchData(status, true);
      } else if (section === 'plugins') {
        await this.InitPluginsData(status, true);
      }
    }
  }

  async ChangeTable(tableName, status, section) {
    if (section === 'fetch') {
      this.fetchActiveTable = tableName;
      this.fetchActiveStatus = status;

      this.pagination[section].pageSize = 5;
      this.pagination[section].pageIndex = 0;
      await this.InitFetchData(status, true);
    } else if (section === 'plugins') {
      this.pluginsActiveTable = tableName;
      this.pluginsActiveStatus = status;

      this.pagination[section].pageSize = 5;
      this.pagination[section].pageIndex = 0;
      await this.InitPluginsData(status, true);
    }
  }
}
