import * as actions from 'src/app/explorer/store/actions/query.actions';
import { ElasticsearchQuery } from 'src/app/explorer/filters/services/interfaces';
export interface QueryState {
  body: ElasticsearchQuery;
  dashboard: string;
}

const initialState: QueryState = {
  body: null,
  dashboard: 'index',
};

export function reducer(
  state = initialState,
  action: actions.QueryActions,
): QueryState {
  switch (action.type) {
    case actions.QueryActionTypes.setQuery: {
      const payload = action.payload;
      console.log(payload);
      return {
        ...state,
        body: payload.body,
        dashboard: payload.dashboard,
      };
    }
    default: {
      return state;
    }
  }
}

export const getQueryBody = (state: QueryState): ElasticsearchQuery =>
  state.body;
export const getQueryFromBody = (body: ElasticsearchQuery): object =>
  body ? body.query : null;
