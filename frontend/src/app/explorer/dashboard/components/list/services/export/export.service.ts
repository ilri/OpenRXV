import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ExporterResponse,
  DataForExporter,
} from '../../paginated-list/filter-paginated-list/types.interface';

@Injectable()
export class ExportService {
  private readonly api_end_export_point: string = environment.api + '/export';
  constructor(private readonly http: HttpClient) {}

  export(d: DataForExporter): Observable<ExporterResponse> {
    return this.http.post(
      this.api_end_export_point,
      d,
    ) as Observable<ExporterResponse>;
  }
}
