import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(private http: HttpClient) { }
  async save(data) {
    return await this.http.post(environment.api + '/settings', data).pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

  async saveExplorerSettings(data) {
    return await this.http.post(environment.api + '/settings/explorer', data).pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

  
  async readAppearanceSettings() {
    return await this.http.get(environment.api + '/settings/appearance').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }
  async saveAppearanceSettings(data) {
    return await this.http.post(environment.api + '/settings/appearance', data).pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

  async saveReportsSettings(data) {
    return await this.http.post(environment.api + '/settings/reportings', data).pipe(map((data: any) => {
      return data;
    })).toPromise();
  }
  async readReports() {
    return await this.http.get(environment.api + '/settings/reports').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

  async readExplorerSettings() {
    return await this.http.get(environment.api + '/settings/explorer').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

  async readPluginsSettings() {
    return await this.http.get(environment.api + '/settings/plugins').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

  async writePluginsSettings(data) {
    return await this.http.post(environment.api + '/settings/plugins', data).pipe(map((data: any) => {
      return data;
    })).toPromise();
  }
  async read() {
    return await this.http.get(environment.api + '/settings').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }


  async retreiveMetadata(linlk) {

    return await this.http.get(environment.api + '/settings/autometa?link=' + linlk).pipe(map((data: any) => {
      return data;
    })).toPromise();

  }

  async upload(file: File) {
    let formdata = new FormData()
    formdata.append('file', file)
    return await this.http.post(environment.api + '/settings/upload/image/', formdata).pipe(map((data: any) => {
      return data.location;
    })).toPromise();
  }

  async uploadFile(file: File) {
    let formdata = new FormData()
    formdata.append('file', file)
    return await this.http.post(environment.api + '/settings/upload/file/', formdata).pipe(map((data: any) => {
      return data.location;
    })).toPromise();
  }
  async getFile(file) {
    this.http.get(environment.api + '/settings/file' + file).subscribe(data => {
      return data;
    })
  }
  async getHarvesterInfo() {
    return await this.http.get(environment.api + '/harvester/info').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }
  
  
  async startPlugins() {
    return await this.http.get(environment.api + '/harvester/start-plugins').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }
  async startReIndex() {
    return await this.http.get(environment.api + '/harvester/start-reindex').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }
  async startIndexing() {
    return await this.http.get(environment.api + '/harvester/startindex').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

  async stopIndexing() {
    return await this.http.get(environment.api + '/harvester/stopindex').pipe(map((data: any) => {
      return data;
    })).toPromise();
  }

}
