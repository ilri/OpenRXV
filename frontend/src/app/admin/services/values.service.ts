import { Injectable } from '@angular/core';
import { HttpClient, HttpUrlEncodingCodec } from '@angular/common/http';
import * as querystring from 'querystring';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class ValuesService {
  constructor(private http: HttpClient) {}
  codec = new HttpUrlEncodingCodec();

  async findByTerm(term = '', index_name = '') {
    return await this.http
      .get(
        environment.api +
          '/values/term?term=' +
          this.codec.encodeValue(term) +
          '&index_name=' +
          this.codec.encodeValue(index_name),
      )
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
  async find(obj = null, index_name = '') {
    let query = '';
    if (obj != null) {
      query = '?' + querystring.stringify(obj);
      query += `&index_name=${index_name}`;
    }

    return await this.http
      .get(environment.api + '/values' + query)
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

  async post(data, index_name = '') {
    data.index_name = index_name;
    return await this.http
      .post(environment.api + '/values', data)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async put(id, data, index_name = '') {
    data.index_name = index_name;
    return await this.http
      .put(environment.api + `/values/${id}`, data)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async delete(id, index_name = '') {
    return await this.http
      .delete(
        environment.api + `/values/${id}/${this.codec.encodeValue(index_name)}`,
      )
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }

  async findOne(id, index_name = '') {
    return await this.http
      .get(
        environment.api + `/values/${id}/${this.codec.encodeValue(index_name)}`,
      )
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
}
