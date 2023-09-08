import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(
    private setttingService: SettingsService,
    private activeRoute: ActivatedRoute,
    ) {}
  completed_count = 0;
  active_count = 0;
  waiting_count = 0;
  failed_count = 0;
  failed = {
    data: new MatTableDataSource<Array<any>>([]),
    pageIndex: 0,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
  };
  completed = {
    data: new MatTableDataSource<Array<any>>([]),
    pageIndex: 0,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
  };

  plugins_completed_count = 0;
  plugins_active_count = 0;
  plugins_waiting_count = 0;
  plugins_failed_count = 0;
  plugins_failed = {
    data: new MatTableDataSource<Array<any>>([]),
    pageIndex: 0,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
  };
  plugins_completed = {
    data: new MatTableDataSource<Array<any>>([]),
    pageIndex: 0,
    pageSize: 5,
    totalPages: 0,
    totalRecords: 0,
  };

  pagination = {
    completed: {
      pageIndex: 0,
      pageSize: 5,
    },
    failed: {
      pageIndex: 0,
      pageSize: 5,
    },
    plugins_completed: {
      pageIndex: 0,
      pageSize: 5,
    },
    plugins_failed: {
      pageIndex: 0,
      pageSize: 5,
    }
  };

  interval = null;
  refreshCounter = 0;
  ngOn;

  index_name: string;

  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    this.Init();
  }
  ngOnDestroy() {
    this.clearInterval();
  }
  setinterval() {
    if (!this.interval)
      this.interval = setInterval(() => {
        this.Init();
      }, 6000);
  }

  clearInterval() {
    if (this.interval != null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async startIndex() {
    await this.setttingService.startIndexing(this.index_name);
    this.refreshCounter = 0;
    this.Init();
  }

  async startReIndex() {
    await this.setttingService.startReIndex(this.index_name);
    this.refreshCounter = 0;
    this.Init();
  }

  async startPlugins() {
    await this.setttingService.startPlugins(this.index_name);
    this.refreshCounter = 0;
    this.Init();
  }

  async stopIndex() {
    this.refreshCounter = 0;
    await this.setttingService.stopIndexing(this.index_name);
    this.Init();
  }

  async Init(tableType: string = null) {
    const {
      type,
      completed_count,
      active_count,
      failed_count,
      waiting_count,
      completed,
      failed,
      plugins_completed_count,
      plugins_active_count,
      plugins_failed_count,
      plugins_waiting_count,
      plugins_completed,
      plugins_failed,
    } = await this.setttingService.getHarvesterInfo(this.index_name, tableType, this.pagination);

    if(type == null){
      this.waiting_count = waiting_count;
      this.active_count = active_count;

      this.plugins_waiting_count = plugins_waiting_count;
      this.plugins_active_count = plugins_active_count;
    }


    if (type == null || type === 'completed') {
      this.completed_count = completed_count;

      this.completed = {
        data: new MatTableDataSource<Array<any>>(completed.data),
        pageIndex: completed.pageIndex,
        pageSize: completed.pageSize,
        totalPages: completed.totalPages,
        totalRecords: completed.totalRecords,
      };
    }

    if (type == null || type === 'failed') {
      this.failed_count = failed_count;

      this.failed = {
        data: new MatTableDataSource<Array<any>>(failed.data),
        pageIndex: failed.pageIndex,
        pageSize: failed.pageSize,
        totalPages: failed.totalPages,
        totalRecords: failed.totalRecords,
      };
    }

    if (type == null || type === 'plugins_completed') {
      this.plugins_completed_count = plugins_completed_count;

      this.plugins_completed = {
        data: new MatTableDataSource<Array<any>>(plugins_completed.data),
        pageIndex: plugins_completed.pageIndex,
        pageSize: plugins_completed.pageSize,
        totalPages: plugins_completed.totalPages,
        totalRecords: plugins_completed.totalRecords,
      };
    }

    if (type == null || type === 'plugins_failed') {
      this.plugins_failed_count = plugins_failed_count;

      this.plugins_failed = {
        data: new MatTableDataSource<Array<any>>(plugins_failed.data),
        pageIndex: plugins_failed.pageIndex,
        pageSize: plugins_failed.pageSize,
        totalPages: plugins_failed.totalPages,
        totalRecords: plugins_failed.totalRecords,
      };
    }

    if (
      plugins_active_count == 0 &&
      plugins_waiting_count == 0 &&
      active_count == 0 &&
      waiting_count == 0 &&
      this.refreshCounter >= 3 &&
      type == null
    )
      this.clearInterval();

    if (this.refreshCounter == 0) this.setinterval();

    if (type == null) {
      this.refreshCounter++;
    }
  }

  paginationChanged(event: PageEvent, type: string) {
    if (this.pagination.hasOwnProperty(type)) {
      this.pagination[type].pageSize = event.pageSize;
      this.pagination[type].pageIndex = event.pageIndex;
      this.Init(type);
    }
  }
}
