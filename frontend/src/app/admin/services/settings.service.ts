import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map, tap } from 'rxjs/operators';
import { Route, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor(private http: HttpClient, private route: Router) {}
  async save(data) {
    return await this.http
      .post(environment.api + '/settings', data)
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
    if (name == null) name = 'index';
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
  async saveDashboardsSettings(data, isNew: boolean) {
    return await this.http
      .post(environment.api + '/settings/dashboards', { data, isNew })
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
  async readReports(dashboard = 'index') {
    if (dashboard == null) dashboard = 'index';
    return await this.http
      .get(`${environment.api}/settings/reports/${dashboard}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async readExplorerSettings(name = 'index') {
    if (name == null) name = 'index';
    return await this.http
      .get(`${environment.api}/settings/explorer/${name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise()
      .catch((e) => {
        this.route.navigate(['notfound']);
        return undefined;
      });
  }

  async readPluginsSettings() {
    return await this.http
      .get(environment.api + '/settings/plugins')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async writePluginsSettings(data) {
    return await this.http
      .post(environment.api + '/settings/plugins', data)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async read() {
    return await this.http
      .get(environment.api + '/settings')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async retreiveMetadata(link, type) {
    return await this.http
      .get(environment.api + `/settings/${type}/autometa?link=` + link)
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
  async getHarvesterInfo(index_name) {
    return await this.http
      .get(environment.api + `/harvester/info/${index_name}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async startPlugins() {
    return await this.http
      .get(environment.api + '/harvester/start-plugins')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async startReIndex() {
    return await this.http
      .get(environment.api + '/harvester/start-reindex')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
  async startIndexing() {
    return await this.http
      .get(environment.api + '/harvester/startindex')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async stopIndexing() {
    return await this.http
      .get(environment.api + '/harvester/stopindex')
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
}
