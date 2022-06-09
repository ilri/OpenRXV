import { PageEvent } from '@angular/material/paginator';
import { SortOption } from 'src/app/explorer/configs/generalConfig.interface';
import {
  hits,
  ElasticsearchQuery,
} from 'src/app/explorer/filters/services/interfaces';
export interface SortPaginationOptions {
  reset: boolean;
  pageEvent: PageEvent;
  sortOption: SortOption;
}

export interface ViewChild {
  linkedId: string;
  compId: string;
}

export enum UpdateCallerBarChart {
  BarChartNgSelect,
  SideFilters,
}

export interface BarComposerHelper {
  subFlag: boolean;
  forgetYearsFromStore: boolean;
}

export interface ExportFiles {
  end: boolean;
  fileName: string;
  scrollId: string;
}

export type FileType = 'pdf' | 'docx' | 'xlsx';

export interface ExporterResponse {
  end: boolean;
  scrollId: string;
  fileName: string;
  hits?: Array<hits>; // undefined in case of pdf & docx
  per_doc_size: number;
  total: number;
  path: string;
}

export interface DataForExporter {
  scrollId?: string;
  type: FileType;
  query: ElasticsearchQuery;
  part: number;
  fileName: string;
  file: any;
  webSiteName: string;
  dashboard:string
}

export interface ExportFilesModal {
  name: string;
  loaded: boolean;
  downloaded: boolean;
  fileName: string;
  hits?: Array<hits>;
}
