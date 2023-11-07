import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as filtersActions from '../actions/filters.actions';
import * as itemsActions from '../actions/items.actions';
import { of } from 'rxjs';

@Injectable()
export class FiltersEffects {
  constructor(private actions$: Actions) {}
  loadFilters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(filtersActions.FiltersActionTypes.setFilters),
      switchMap((action: filtersActions.SetFilters) => {
        return of(new itemsActions.GetData(action.payload));
      }),
    ),
  );
}
