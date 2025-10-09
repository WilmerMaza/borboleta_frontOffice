import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment.development";
import { AuthUserState, RegisterModal } from "../interface/auth.interface";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  public redirectUrl: string | undefined;
  public confirmed: boolean = false;
  public isLogin: boolean = false;

  constructor(private http: HttpClient) {}

  // Método de registro
  register(payload: RegisterModal): Observable<any> {
    return this.http.post<any>(`${environment.URLS}/users/register`, payload);
  }

  // Método de login
  login(payload: AuthUserState): Observable<any> {
    return this.http.post<any>(`${environment.URLS}/users/login`, payload, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    });
  }
}
