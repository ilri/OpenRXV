import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as dayjs from 'dayjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient, private route: Router) {}
  async save(data, index_name: string) {
    return await this.http
      .post(environment.api + `/settings/${index_name}`, data)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async saveExplorerSettings(dashboard_name, data) {
    return await this.http
      .post(environment.api + '/settings/explorer', { dashboard_name, data })
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async readAppearanceSettings(name) {
    if (name == null) name = 'DEFAULT_DASHBOARD';
    return await this.http
      .get(`${environment.api}/settings/appearance/${name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async saveAppearanceSettings(dashboard_name, data) {
    return await this.http
      .post(environment.api + '/settings/appearance', { dashboard_name, data })
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async readIndexesSettings() {
    return await this.http
      .get(environment.api + '/settings/indexes')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async saveIndexesSettings(data, isNew: boolean, deleted: any) {
    if (data?.interval_date) {
      data.interval_date = dayjs(data.interval_date).format('YYYY-MM-DD');
    }
    return await this.http
      .post(environment.api + '/settings/indexes', { data, isNew, deleted })
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async readDashboardsSettings() {
    return await this.http
      .get(environment.api + '/settings/dashboards')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async saveDashboardsSettings(data, isNew: boolean, defaultDashboard: string) {
    return await this.http
      .post(environment.api + '/settings/dashboards', {
        data,
        isNew,
        defaultDashboard,
      })
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async setDashboardAsDefault(defaultDashboard) {
    return await this.http
      .post(environment.api + '/settings/defaultdashboard', {
        defaultDashboard,
      })
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async saveReportsSettings(data, dashboard_name) {
    return await this.http
      .post(environment.api + '/settings/reportings', { dashboard_name, data })
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async readReports(dashboard = 'DEFAULT_DASHBOARD') {
    if (dashboard == null) dashboard = 'DEFAULT_DASHBOARD';
    return await this.http
      .get(`${environment.api}/settings/reports/${dashboard}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async readExplorerSettings(dashboard_name = 'DEFAULT_DASHBOARD') {
    if (dashboard_name == null) dashboard_name = 'DEFAULT_DASHBOARD';
    return await this.http
      .get(`${environment.api}/settings/explorer/${dashboard_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise()
      .catch((e) => {
        this.route.navigate(['admin/indexes']);
        return undefined;
      });
  }

  async readPluginsSettings(index_name: string) {
    return await this.http
      .get(environment.api + `/settings/plugins/${index_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async writePluginsSettings(data, index_name: string) {
    return await this.http
      .post(environment.api + `/settings/plugins/${index_name}`, data)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async read(index_name) {
    return await this.http
      .get(environment.api + `/settings/${index_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async retreiveMetadata(link, repository_type) {
    return await this.http
      .get(
        environment.api +
          `/settings/repository/metadata-auto-retrieve?repository_type=${repository_type}&link=${link}`,
      )
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async readOutSourcePlugins() {
    return await this.http
      .get(environment.api + '/settings/outsourcePlugins')
      .pipe(
        tap((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async upload(file: File) {
    const formdata = new FormData();
    formdata.append('file', file);
    return await this.http
      .post(environment.api + '/settings/upload/image/', formdata)
      .pipe(
        map((data: any) => {
          return data.location;
        }),
      )
      .toPromise();
  }

  async uploadFile(file: File) {
    const formdata = new FormData();
    formdata.append('file', file);
    return await this.http
      .post(environment.api + '/settings/upload/file/', formdata)
      .pipe(
        map((data: any) => {
          return data.location;
        }),
      )
      .toPromise();
  }
  async getFile(file) {
    this.http
      .get(environment.api + '/settings/file' + file)
      .subscribe((data) => {
        return data;
      });
  }
  async getHarvesterInfo(
    index_name: string,
    section: string,
    status: string,
    pagination: any,
  ) {
    const params = new HttpParams()
      .set('section', section ? section : '')
      .set('status', status ? status : '')
      .set('pageIndex', pagination.pageIndex ? pagination.pageIndex : 0)
      .set('pageSize', pagination.pageSize ? pagination.pageSize : 5);

    return await this.http
      .get(
        environment.api + `/harvester/info/` + encodeURIComponent(index_name),
        { params: params },
      )
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async startPlugin(index_name: string, plugin_name: string) {
    return await this.http
      .get(
        environment.api +
          `/harvester/start-plugins/${index_name}/${plugin_name}`,
      )
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async stopPlugin(index_name: string, plugin_name: string) {
    return await this.http
      .get(
        environment.api +
          `/harvester/stop-plugins/${index_name}/${plugin_name}`,
      )
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async commitIndex(index_name: string) {
    return await this.http
      .get(environment.api + `/harvester/commit-index/${index_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async startHarvesting(index_name: string) {
    return await this.http
      .get(environment.api + `/harvester/harvest-start/${index_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async stopHarvesting(index_name: string) {
    return await this.http
      .get(environment.api + `/harvester/harvest-stop/${index_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async stopAll(index_name: string) {
    return await this.http
      .get(environment.api + `/harvester/harvest-stop-all/${index_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
}
