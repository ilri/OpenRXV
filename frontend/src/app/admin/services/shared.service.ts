import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  constructor(private http: HttpClient) {}

  async getSharedLinks(dashboard_name: string) {
    return await this.http
      .get(environment.api + `/share/${dashboard_name}`)
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
}
