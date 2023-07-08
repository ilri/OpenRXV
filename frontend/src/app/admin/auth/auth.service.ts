import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import jwt_decode from 'jwt-decode';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  isLoggedIn = false;
  constructor(
    public jwtHelper: JwtHelperService,
    private httpService: HttpClient,
  ) {}
  public isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (token) {
      const tokenPayload = jwt_decode(token);
    } else return false;
    // decode the token to get its payload

    return !this.jwtHelper.isTokenExpired(token);
  }

  getToken() {
    return localStorage.getItem('token')
      ? localStorage.getItem('token')
      : false;
  }

  user() {}

  async login(userinfo) {
    await localStorage.setItem('token', '');
    let res: any = await this.httpService
      .post(environment.api + '/auth/login', userinfo)
      .pipe(map((res: any) => res))
      .toPromise();
    await localStorage.setItem('token', res.access_token);

    return res.access_token;
  }
}
