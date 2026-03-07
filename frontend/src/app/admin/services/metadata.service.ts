import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class MetadataService {
  private http = inject(HttpClient);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  async get(name, index) {
    name = name == null ? 'index' : name;
    index = index == null ? '' : index;
    return await this.http
      .get(environment.api + `/settings/metadata/${name}/${index}`)
      .pipe(
        map((data: any) => {
          return data;
        }),
      )
      .toPromise();
  }
}
