import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import {
  ElasticsearchResponse,
  ElasticsearchQuery,
} from 'src/app/explorer/filters/services/interfaces';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private readonly api_end_point: string = environment.api + '/search';
  constructor(private http: HttpClient) {}

  getItems(
    query: ElasticsearchQuery,
    dashboard: string = 'index',
  ): Observable<ElasticsearchResponse> {
    return this.http.post(this.api_end_point, { dashboard, query });
  }

  async getShare(id: string) {
    return await this.http
      .get(environment.api + '/share/' + id)
      .pipe(map((data) => data))
      .toPromise();
  }

  async saveShare(attr: any) {
    if (Object.keys(attr).length)
      return (
        '/shared/' +
        (await this.http
          .post(environment.api + '/share', attr)
          .pipe(map((data: any) => data._id))
          .toPromise())
      );
    else return '';
  }
}
