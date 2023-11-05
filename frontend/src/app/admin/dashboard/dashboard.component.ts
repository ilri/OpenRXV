import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationComponent } from '../components/confirmation/confirmation.component';
import { CommonService } from '../../common.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private settingsService: SettingsService,
    private activeRoute: ActivatedRoute,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private commonService: CommonService,
    ) {}

  availableSections = [];
  tablesData: any = {};
  pagination: any = {};
  activeTables: any = {};
  refreshCounter: any = {};
  progress: any = {};

  index_name: string;

  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');

    const availableSections = await this.settingsService.readPluginsSettings(this.index_name);
    this.availableSections = availableSections.filter((plugin) => plugin?.values && plugin.values.length > 0);
    this.availableSections.unshift({
      name: 'fetch',
      display_name: 'Harvest',
    });
    for (const availableSection of this.availableSections) {
      this.tablesData[availableSection.name] = {
        active_count: 0,
        waiting_count: 0,
        completed_count: 0,
        failed_count: 0,
        stuck_count: 0,
        startedAt: null,
        table: {
          data: new MatTableDataSource<Array<any>>([]),
          pageIndex: 0,
          pageSize: 5,
          totalPages: 0,
          totalRecords: 0,
        }
      };
      this.pagination[availableSection.name] = {
        pageIndex: 0,
        pageSize: 5,
      };
      this.activeTables[availableSection.name] = {
        table: 'Active',
        status: 'active',
      };
      this.refreshCounter[availableSection.name] = {
        counter: 0,
        interval: null,
      };
      this.progress[availableSection.name] = {
        percentage: 0,
        estimation: '',
        totalJobs: 0,
      };
    }
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
        const response = await this.settingsService.startHarvesting(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          for (const availableSection of this.availableSections) {
            this.refreshCounter[availableSection.name].counter = 0;
          }
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
        const response = await this.settingsService.commitIndex(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          for (const availableSection of this.availableSections) {
            this.refreshCounter[availableSection.name].counter = 0;
          }
          await this.Init();
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async startPlugin(plugin) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: `Are you sure you want to start the plugin <b>${plugin.display_name}</b>?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const response = await this.settingsService.startPlugin(this.index_name, plugin.name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          for (const availableSection of this.availableSections) {
            if (availableSection.name === plugin.name) {
              this.refreshCounter[availableSection.name].counter = 0;
              await this.InitPluginsData(availableSection, this.activeTables?.[availableSection.name]?.status);
            }
          }
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async stopPlugin(plugin) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: `Are you sure you want to stop the plugin <b>${plugin.display_name}</b>?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const response = await this.settingsService.stopPlugin(this.index_name, plugin.name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          for (const availableSection of this.availableSections) {
            if (availableSection.name === plugin.name) {
              this.refreshCounter[availableSection.name].counter = 0;
              await this.InitPluginsData(availableSection, this.activeTables?.[availableSection.name]?.status);
            }
          }
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
        const response = await this.settingsService.stopHarvesting(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          this.refreshCounter.fetch.counter = 0;
          await this.InitFetchData(this.activeTables?.fetch?.status);
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async stopAll() {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: '',
        subtitle: 'Are you sure you want to stop harvesting and plugins?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        const response = await this.settingsService.stopAll(this.index_name);
        if (response.success) {
          this.toastr.success(response?.message ? response.message : 'Success');
          for (const availableSection of this.availableSections) {
            this.refreshCounter[availableSection.name].counter = 0;
          }
          this.Init();
        } else {
          this.toastr.error(response?.message ? response.message : 'Oops! something went wrong');
        }
      }
    });
  }

  async Init() {
    await this.InitFetchData(this.activeTables?.fetch?.status);
    for (const availableSection of this.availableSections) {
      if (availableSection.name !== 'fetch') {
        await this.InitPluginsData(availableSection, this.activeTables?.[availableSection.name]?.status);
      }
    }
  }

  async InitFetchData(status: string = null, paginationRefresh = false) {
    const {
      active_count,
      waiting_count,
      completed_count,
      failed_count,
      stuck_count,
      startedAt,
      table,
    } = await this.settingsService.getHarvesterInfo(this.index_name, 'fetch', status, this.pagination.fetch);

    this.tablesData.fetch.active_count = active_count;
    this.tablesData.fetch.waiting_count = waiting_count;
    this.tablesData.fetch.completed_count = completed_count;
    this.tablesData.fetch.failed_count = failed_count;
    this.tablesData.fetch.stuck_count = stuck_count;
    this.tablesData.fetch.startedAt = startedAt;
    this.tablesData.fetch.table = {
      data: new MatTableDataSource<Array<any>>(table.data),
      pageIndex: table.pageIndex,
      pageSize: table.pageSize,
      totalPages: table.totalPages,
      totalRecords: table.totalRecords,
    };
    this.CalculateProgress('fetch');
    if (this.tablesData.fetch.active_count == 0 && this.tablesData.fetch.active_count == 0 && this.refreshCounter.fetch.counter >= 3) {
      if (this.refreshCounter.fetch.interval != null) {
        clearInterval(this.refreshCounter.fetch.interval);
        this.refreshCounter.fetch.interval = null;
      }
    }

    if (this.refreshCounter.fetch.counter == 0) {
      if (!this.refreshCounter.fetch.interval)
        this.refreshCounter.fetch.interval = setInterval(() => {
          this.InitFetchData(this.activeTables?.fetch?.status);
        }, 6000);
    }

    if (!paginationRefresh) {
      this.refreshCounter.fetch.counter++;
    }
  }

  async InitPluginsData(plugin: any, status: string = null, paginationRefresh = false) {
    if (plugin?.name) {
      const {
        active_count,
        waiting_count,
        completed_count,
        failed_count,
        stuck_count,
        startedAt,
        table,
      } = await this.settingsService.getHarvesterInfo(this.index_name, plugin.name, status, this.pagination[plugin.name]);

      this.tablesData[plugin.name].active_count = active_count;
      this.tablesData[plugin.name].waiting_count = waiting_count;
      this.tablesData[plugin.name].completed_count = completed_count;
      this.tablesData[plugin.name].failed_count = failed_count;
      this.tablesData[plugin.name].stuck_count = stuck_count;
      this.tablesData[plugin.name].startedAt = startedAt;
      this.tablesData[plugin.name].table = {
        data: new MatTableDataSource<Array<any>>(table.data),
        pageIndex: table.pageIndex,
        pageSize: table.pageSize,
        totalPages: table.totalPages,
        totalRecords: table.totalRecords,
      };
      this.CalculateProgress(plugin.name);
      if (this.tablesData[plugin.name].active_count == 0 && this.tablesData[plugin.name].active_count == 0 && this.refreshCounter[plugin.name].counter >= 3) {
        if (this.refreshCounter[plugin.name].interval != null) {
          clearInterval(this.refreshCounter[plugin.name].interval);
          this.refreshCounter[plugin.name].interval = null;
        }
      }

      if (this.refreshCounter[plugin.name].counter == 0) {
        if (!this.refreshCounter[plugin.name].interval)
          this.refreshCounter[plugin.name].interval = setInterval(() => {
            this.InitPluginsData(plugin, this.activeTables?.[plugin.name].status);
          }, 6000);
      }

      if (!paginationRefresh) {
        this.refreshCounter[plugin.name].counter++;
      }
    }
  }

  async PaginationChanged(event: PageEvent, status: string, section: string) {
    if (this.pagination.hasOwnProperty(section)) {
      this.pagination[section].pageSize = event.pageSize;
      this.pagination[section].pageIndex = event.pageIndex;
      if (section === 'fetch') {
        await this.InitFetchData(status, true);
      } else {
        for (const availablePlugin of this.availableSections) {
          if (section === availablePlugin.name) {
            await this.InitPluginsData(availablePlugin, status, true);
          }
        }
      }
    }
  }

  async ChangeTable(tableName, status, section) {
    if (section === 'fetch') {
      this.activeTables.fetch.table = tableName;
      this.activeTables.fetch.status = status;

      this.pagination[section].pageSize = 5;
      this.pagination[section].pageIndex = 0;
      await this.InitFetchData(status, true);
    } else {
      this.activeTables[section].table = tableName;
      this.activeTables[section].status = status;

      this.pagination[section].pageSize = 5;
      this.pagination[section].pageIndex = 0;
      for (const availablePlugin of this.availableSections) {
        if (section === availablePlugin.name) {
          await this.InitPluginsData(availablePlugin, status, true);
        }
      }
    }
  }

  CalculateProgress(section) {
    this.progress[section].totalJobs = this.tablesData[section].active_count + this.tablesData[section].waiting_count + this.tablesData[section].completed_count;
    if (this.progress[section].totalJobs > 0) {
      this.progress[section].percentage = this.tablesData[section].completed_count / (this.progress[section].totalJobs) * 100;
    } else {
      this.progress[section].percentage = 0;
    }

    if (this.tablesData[section].startedAt && this.tablesData[section].completed_count > 0) {
      const startTime = new Date(this.tablesData[section].startedAt).getTime();
      const now = new Date().getTime();
      const completed = this.tablesData[section].completed_count;
      const seconds = (now - startTime) / 1000 / completed * (this.tablesData[section].waiting_count + this.tablesData[section].active_count);

      this.progress[section].estimation = this.commonService.HumanReadableTime(seconds);
    } else {
      this.progress[section].estimation = '';
    }
  }
}
