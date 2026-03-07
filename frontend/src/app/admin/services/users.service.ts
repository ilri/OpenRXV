import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import * as querystring from 'querystring';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private http = inject(HttpClient);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  validateUsers(obj = null) {
    let query = '';
    if (obj != null) {
      query = '?' + querystring.stringify(obj);
    }
    return this.http
      .get(environment.api + '/users' + query)
      .pipe(
        map((data: any) => {
          data.hits = data.hits.map((element) => {
            return { ...{ id: element._id }, ...element._source };
          });

          return data && data.total > 0 ? { valueExist: true } : null;
        }),
      )
      .toPromise();
  }

  async getUsers(obj = null) {
    let query = '';
    if (obj != null) {
      query = '?' + querystring.stringify(obj);
    }

    return await this.http
      .get(environment.api + '/users' + query)
      .pipe(
        map((data: any) => {
          data.hits = data.hits.map((element) => {
            return { ...{ id: element._id }, ...element._source };
          });
          return data;
        }),
      )
      .toPromise();
  }

  async PostUser(data) {
    return await this.http
      .post(environment.api + '/users', data)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async updateUser(id, data) {
    return await this.http
      .put(environment.api + `/users/${id}`, data)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async deleteUser(id) {
    return await this.http
      .delete(environment.api + `/users/${id}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async getUser(id) {
    return await this.http
      .get(environment.api + `/users/${id}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
}
