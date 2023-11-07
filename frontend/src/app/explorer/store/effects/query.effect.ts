import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as queryActions from '../actions/query.actions';
import * as itemsActions from '../actions/items.actions';
import { of } from 'rxjs';

@Injectable()
export class QueryEffects {
  constructor(private actions$: Actions) {}
  loadQuery$ = createEffect(() =>
    this.actions$.pipe(
      ofType(queryActions.QueryActionTypes.setQuery),
      switchMap((action: queryActions.SetQuery) => {
        return of(new itemsActions.GetData(action.payload));
      }),
    ),
  );
}
