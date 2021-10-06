import {
  AgmCoreModule,
  LAZY_MAPS_API_CONFIG,
  LazyMapsAPILoaderConfigLiteral,
} from '@agm/core';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export function agmConfigFactory(
  http: HttpClient,
  config: LazyMapsAPILoaderConfigLiteral,
) {
  return () =>
    http
      .get(environment.api + '/settings/appearance')
      .pipe(
        map((response: any) => {
          if (response && response.google_maps_api_key) {
            config.apiKey = response.google_maps_api_key;
            return response;
          }
        }),
      )
      .toPromise();
}
