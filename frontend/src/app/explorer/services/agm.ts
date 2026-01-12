import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

export function agmConfigFactory(http: HttpClient) {
  return () =>
    http
      .get(environment.api + '/settings/appearance')
      .toPromise()
      .then((response: any) => {
        const apiKey = response?.google_maps_api_key ? response.google_maps_api_key : '';
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          script.async = true;
          script.defer = true;
          script.onload = () => {
            resolve(response);
          };
          script.onerror = () => {
            console.error('Google Maps API failed to load');
            resolve(response);
          };
          document.head.appendChild(script);
        });
      });
}
