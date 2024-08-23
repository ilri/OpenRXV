import { Bucket } from 'src/app/explorer/filters/services/interfaces';

export interface Tour {
  id: string;
  description: string;
  text: string;
  title: string;
}

export interface GeneralConfigs {
  show?: boolean;
  tour?: boolean;
  component?: string;
  title?: string;
  componentConfigs: any;
  class?: string;
  scroll?: Scroll;
}

export interface Scroll {
  icon?: string;
  linkedWith?: string;
}

export interface ComponentDashboardConfigs {
  id: string;
  title: string;
  description: string;
  source: string | Array<string>;
  content?: PaginatedListConfigs;
  related?: boolean;
  size?: number;
}

export interface ComponentCounterConfigs {
  id: string;
  title: string;
  icon?: string;
  source: string;
  percentageFromTotal?: boolean;
  filter?: string;
  description?: string;
}

export interface ComponentLabelConfigs {
  text: string;
  border?: boolean;
  description?: string;
}

export interface ComponentSearchConfigs {
  placeholder: string;
  type: searchOptions;
}

export interface ComponentFilterConfigs {
  source: string;
  placeholder: string;
  expandPosition?: 'top' | 'bottom';
  data_labels?: boolean;
  data_labels_count?: boolean;
  data_labels_percentage?: boolean;
  hide_total?: boolean;
  hide_percentage?: boolean;
}

export interface SortOption {
  display: string;
  value: string;
  sort?: 'desc' | 'asc';
}

/**
 * `tags` are `object with {[key: string]: string}`
 * * tags :
 *    * key => is the label e.g: Subject : <data>
 *    * string => is the value e.g: <label> : 92
 */
export interface PaginatedListConfigs {
  identifierUriPrefix: string;
  icon: string;
  title: string;
  description: string;
  tags: object;
  identifierUri: string;
  altmetric: boolean;
  filterOptions: SortOption[];
}

export enum searchOptions {
  titleSearch,
  allSearch,
}

export interface MergedSelect {
  [key: string]: Array<Bucket>;
}
