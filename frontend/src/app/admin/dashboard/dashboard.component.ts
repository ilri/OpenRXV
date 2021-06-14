import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  constructor(private setttingService: SettingsService) { }
  completed_count = 0
  active_count = 0;
  waiting_count = 0;
  failed_count = 0;
  failed = new MatTableDataSource<Array<any>>([]);
  completed = new MatTableDataSource<Array<any>>([])

  plugins_completed_count = 0
  plugins_active_count = 0;
  plugins_waiting_count = 0;
  plugins_failed_count = 0;
  plugins_failed = new MatTableDataSource<Array<any>>([]);
  plugins_completed = new MatTableDataSource<Array<any>>([])


  interval = null
  refreshCounter = 0;
  ngOn
  async ngOnInit() {
    this.Init();
  }
  ngOnDestroy() {
    this.clearInterval();
  }
  setinterval() {
    if (!this.interval)
      this.interval = setInterval(() => {
        this.Init()
      }, 6000)
  }

  clearInterval() {
    if (this.interval != null) {
      clearInterval(this.interval)
      this.interval = null;
    }
  }

  async startIndex() {
    await this.setttingService.startIndexing();
    this.refreshCounter = 0
    this.Init()

  }

  async startReIndex() {
    await this.setttingService.startReIndex();
    this.refreshCounter = 0
    this.Init()

  }

  async startPlugins() {
    await this.setttingService.startPlugins();
    this.refreshCounter = 0
    this.Init()

  }

  

  

  async stopIndex() {
    this.refreshCounter = 0
    await this.setttingService.stopIndexing();
    this.Init()
  }

  async Init() {

    let { completed_count, active_count, failed_count, waiting_count, completed, failed, plugins_completed_count, plugins_active_count, plugins_failed_count, plugins_waiting_count, plugins_completed, plugins_failed } = await this.setttingService.getHarvesterInfo();

    this.completed_count = completed_count
    this.failed_count = failed_count
    this.waiting_count = waiting_count
    this.active_count = active_count

    this.completed = new MatTableDataSource<Array<any>>(completed)
    this.failed = new MatTableDataSource<Array<any>>(failed)

    this.plugins_completed_count = plugins_completed_count
    this.plugins_failed_count = plugins_failed_count
    this.plugins_waiting_count = plugins_waiting_count
    this.plugins_active_count = plugins_active_count

    this.plugins_completed = new MatTableDataSource<Array<any>>(plugins_completed)
    this.plugins_failed = new MatTableDataSource<Array<any>>(plugins_failed)

    if (plugins_active_count == 0 && plugins_waiting_count == 0 && active_count == 0 && waiting_count == 0 && this.refreshCounter >= 3)
      this.clearInterval()

    if (this.refreshCounter == 0)
      this.setinterval()

    this.refreshCounter++;
  }

}
