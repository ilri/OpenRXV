import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ExporterResponse,
  DataForExporter,
} from '../../paginated-list/filter-paginated-list/types.interface';

@Injectable()
export class ExportService {
  private readonly http = inject(HttpClient);

  private readonly api_end_export_point: string = environment.api + '/export';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  export(d: DataForExporter): Observable<ExporterResponse> {
    return this.http.post(
      this.api_end_export_point,
      d,
    ) as Observable<ExporterResponse>;
  }
}
