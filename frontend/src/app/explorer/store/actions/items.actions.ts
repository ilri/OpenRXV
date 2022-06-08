import { Action } from '@ngrx/store';
import {
  ElasticsearchResponse,
  ElasticsearchQuery,
} from 'src/app/explorer/filters/services/interfaces';
import { InView, ESHttpError } from './actions.interfaces';

export enum ActionTypes {
  getData = '[items] GetData',
  getDataSuccess = '[items] GetDataSuccess',
  getDataError = '[items] GetDataError',
  SetCounters = '[items] SetCounters',
  GetCounters = '[items] GetCounters',
  SetInView = '[items] SetInView',
  updateYears = '[items] UpdateYears',
}

export class GetData implements Action {
  readonly type = ActionTypes.getData;
  constructor(public payload: any = null) {}
}

/**
 * In the case of getting the years for the filters and the bar chart
 * we don't want to replace the hists we have in the store with undefined
 * which comes when getting the years for these two components.
 * this is why the `addHits` exists
 */
export class GetDataSuccess implements Action {
  readonly type = ActionTypes.getDataSuccess;
  constructor(
    public payload: ElasticsearchResponse = null,
    public addHits: boolean = true,
  ) {}
}

export class GetDataError implements Action {
  readonly type = ActionTypes.getDataError;
  constructor(public payload: ESHttpError = null) {}
}

export class SetCounters implements Action {
  readonly type = ActionTypes.SetCounters;
  constructor(public payload = null) {}
}

export class GetCounters implements Action {
  readonly type = ActionTypes.GetCounters;
  constructor(public payload = null) {}
}

export class SetInView implements Action {
  readonly type = ActionTypes.SetInView;
  constructor(public payload: InView = null) {}
}

export class UpdateYears implements Action {
  readonly type = ActionTypes.updateYears;
  constructor(public payload: Array<number> = null) {}
}

export type itemsActions =
  | GetData
  | GetDataError
  | GetDataSuccess
  | SetCounters
  | GetCounters
  | SetInView
  | UpdateYears;
