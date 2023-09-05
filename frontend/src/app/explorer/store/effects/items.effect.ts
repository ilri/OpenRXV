import { Injectable } from '@angular/core';
import { switchMap, map, catchError } from 'rxjs/operators';
import { Actions, Effect, ofType } from '@ngrx/effects';
import * as itemsactions from '../actions/items.actions';
import { ItemsService } from 'src/app/explorer/services/itemsService/items.service';
import { of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ElasticsearchResponse } from 'src/app/explorer/filters/services/interfaces';

@Injectable()
export class ItemsEffects {
  constructor(private actions$: Actions, private itemsService: ItemsService) {}
  @Effect()
  loadItems$ = this.actions$.pipe(
    ofType(itemsactions.ActionTypes.getData),
    switchMap((action: itemsactions.GetData) => {
      return this.itemsService
        .getItems(action.payload.body, action.payload.dashboard)
        .pipe(
          map(
            (items: ElasticsearchResponse) =>
              new itemsactions.GetDataSuccess(items),
          ),
          catchError((error: HttpErrorResponse) =>
            of(
              new itemsactions.GetDataError({
                type: itemsactions.ActionTypes.getData,
                error,
              }),
            ),
          ),
        );
    }),
  );

  @Effect()
  loadCounters$ = this.actions$.pipe(
    ofType(itemsactions.ActionTypes.SetCounters),
    switchMap((action: itemsactions.SetCounters) => {
      return this.itemsService.getItems(action.payload).pipe(
        map(
          (items: ElasticsearchResponse) => new itemsactions.GetCounters(items),
        ),
        catchError((error: HttpErrorResponse) =>
          of(
            new itemsactions.GetDataError({
              type: itemsactions.ActionTypes.SetCounters,
              error,
            }),
          ),
        ),
      );
    }),
  );
}
