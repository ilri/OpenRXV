import * as actions from 'src/app/explorer/store/actions/items.actions';
import { mapObjIndexed } from 'ramda';
import {
  ElasticsearchResponse,
  Bucket,
} from 'src/app/explorer/filters/services/interfaces';
import { InView } from '../actions/actions.interfaces';

export interface ViewState {
  userSeesMe: boolean;
  linkedWith?: string;
  collapsed?: boolean; // only the component that have a panel will change this
}

export interface InViewState {
  [key: string]: ViewState;
}

export interface ItemsState {
  data: ElasticsearchResponse;
  counters: any;
  inView: InViewState;
  loading: boolean;
  loaded: boolean;
  loadingOnlyHits: boolean;
  error: any;
}

const initialState: ItemsState = {
  data: {},
  counters: {},
  inView: {},
  loaded: false,
  loading: true,
  loadingOnlyHits: false,
  error: null,
};

export function reducer(
  state = initialState,
  action: actions.itemsActions,
): ItemsState {
  switch (action.type) {
    case actions.ActionTypes.getDataSuccess: {
      const { payload, addHits } = action;
      return {
        ...state,
        data: {
          hits: {
            ...state.data.hits,
            ...(addHits ? payload.hits : {}),
          },
          aggregations: {
            ...state.data.aggregations,
            ...payload.aggregations,
          },
        },
        loadingOnlyHits: false,
        loading: false,
        loaded: true,
      };
    }
    case actions.ActionTypes.GetCounters: {
      const counters = action.payload;
      return {
        ...state,
        counters,
      };
    }
    case actions.ActionTypes.SetInView: {
      const {
        id,
        viewState: { collapsed, linkedWith, userSeesMe },
      } = action.payload;
      const comp: ViewState = state.inView[id];
      const origianlCollapsed = comp && comp.collapsed;
      return {
        ...state,
        inView: {
          ...state.inView,
          [id]: {
            userSeesMe,
            collapsed: collapsed === undefined ? origianlCollapsed : collapsed,
            linkedWith,
          },
        },
      };
    }
    case actions.ActionTypes.getDataError: {
      const error = action.payload;
      return {
        ...state,
        error,
        loading: false,
        loaded: true,
        loadingOnlyHits: false,
      };
    }
    case actions.ActionTypes.getData: {
      return {
        ...state,
        loadingOnlyHits: !action.payload.aggs,
        loading: true,
        loaded: false,
      };
    }
    case actions.ActionTypes.updateYears: {
      return {
        ...state,
        data: {
          ...state.data,
          aggregations: {
            ...state.data.aggregations,
            'year.keyword': {
              ...state.data.aggregations['year.keyword'],
              buckets: action.payload.map(
                (n: number) => ({ doc_count: null, key: `${n}` }) as Bucket,
              ),
            },
          },
        },
      };
    }
    default: {
      return state;
    }
  }
}

export const getData = (state: ItemsState) => state.data;

export const getHits = (data: ElasticsearchResponse) => data.hits;

export const countersState = (state: ItemsState) => state.counters.aggregations;

export const inViewState = (state: ItemsState) => state.inView;

export const getErrors = (state: ItemsState) => state.error;

export const inViewAsArray = (state: ItemsState) => {
  mapObjIndexed((num, key, obj) => {
    return { id: key, value: obj[key] };
  }, state.inView);
};

export const inViewFirstOne = (state: ItemsState) =>
  Object.values(
    mapObjIndexed(
      (viewState: ViewState, id: string, obj: object): InView => ({
        id,
        viewState,
      }),
      state.inView,
    ),
  ).filter(({ viewState }: InView) => viewState.userSeesMe)[0] || [];

export const totalState = (state: ItemsState) =>
  state.data.hits ? state.data.hits.total.value : null;

export const loadingStatus = (state: ItemsState) => state.loading;

export const loadingOnlyHits = (state: ItemsState) => state.loadingOnlyHits;

export const loadedStatus = (state: ItemsState) => state.loading;
