import * as fromItems from './items.reducer';
import * as fromQueries from './query.reducer';
import {
  ActionReducerMap,
  createSelector,
  createFeatureSelector,
} from '@ngrx/store';
import { ElasticsearchResponse } from 'src/app/explorer/filters/services/interfaces';

export interface AppState {
  items: fromItems.ItemsState;
  query: fromQueries.QueryState;
}

export interface ItemsState {
  items: fromItems.ItemsState;
}

export const reducers: ActionReducerMap<AppState> = {
  items: fromItems.reducer,
  query: fromQueries.reducer,
};

// FeatureSelectors
export const getItemsState =
  createFeatureSelector<fromItems.ItemsState>('items');
export const getQueryState =
  createFeatureSelector<fromQueries.QueryState>('query');

// items Selectors
export const getLoadingStatus = createSelector(
  getItemsState,
  fromItems.loadingStatus,
);

export const getLoadingOnlyHits = createSelector(
  getItemsState,
  fromItems.loadingOnlyHits,
);

// get counters selector
export const getCounters = createSelector(
  getItemsState,
  fromItems.countersState,
);
// get Inview Selector
export const getInView = createSelector(getItemsState, fromItems.inViewState);

export const getErrors = createSelector(getItemsState, fromItems.getErrors);

export const getInViewById = createSelector(
  getInView,
  (items: fromItems.InViewState, id: string) => items[id],
);

export const getInViewFirstOne = createSelector(
  getItemsState,
  fromItems.inViewFirstOne,
);

export const getTotal = createSelector(getItemsState, fromItems.totalState);

// getting the data feild from the state
export const getItems = createSelector(getItemsState, fromItems.getData);

// getting the bucket from
// itemState.data.aggregations[KEY].buckets
export const getBuckets = createSelector(
  getItems,
  (items: ElasticsearchResponse, key: string) => {
    if (items.aggregations !== undefined) {
      const aggs = items.aggregations;
      if (aggs[key]) {
        if (aggs[key]?.buckets) {
          return aggs[key] && aggs[key].buckets;
        } else if (aggs[key]?.[key]?.buckets) {
          return aggs[key] && aggs[key][key].buckets;
        }
      }
      return false;
    }
  },
);

export const getNestedBuckets = createSelector(
  getItems,
  (items: ElasticsearchResponse, id: string) => {
    if (items.aggregations !== undefined) {
      const aggs = items.aggregations;
      if (aggs[id]) {
        if (aggs[id]?.buckets) {
          return aggs[id] && aggs[id].buckets;
        } else if (aggs[id]?.[id]?.buckets) {
          return aggs[id] && aggs[id][id].buckets;
        }
      }
      return false;
    }
  },
);

export const getHits = createSelector(getItems, fromItems.getHits);

export const getAggregation = createSelector(
  getItems,
  (
    items: ElasticsearchResponse,
    sourceFilter: { source: string; filter: string; counterIndex: number },
  ) => {
    // just a safe check, so no errors will be logged to the console
    // undefined won't come when the page loads for the first time
    // it used to come when the component asks the stroe for a data
    // and the http request is not yet finished, now the components
    // will ask the store only when the request is finished and the
    // loading is false
    if (items.aggregations !== undefined) {
      let key: string;
      sourceFilter.source = sourceFilter.source.replace('.keyword', '');
      if (sourceFilter.filter) {
        // Filtered counter values
        key = `${sourceFilter.source}_${sourceFilter.counterIndex}_${sourceFilter.filter}`;
      } else {
        key = `${sourceFilter.source}_${sourceFilter.counterIndex}`;
      }

      // Pre-filtered aggs will have the aggs object inside the same key {total: {total: {...}}}
      return items.aggregations[key]?.[key]
        ? items.aggregations[key][key]
        : items.aggregations[key] || 0;
    }
  },
);

// query selectors

export const getQuery = createSelector(getQueryState, fromQueries.getQueryBody);

export const getQueryFromBody = createSelector(
  getQuery,
  fromQueries.getQueryFromBody,
);
