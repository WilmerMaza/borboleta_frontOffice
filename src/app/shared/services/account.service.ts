import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment.development";
import { AccountUser } from "../interface/account.interface";

@Injectable({
  providedIn: "root",
})
export class AccountService {
  public isOpenMenu: boolean = false;

  constructor(private http: HttpClient) {}

  getUserDetails(): Observable<any> {
    return this.http.get<any>(`${environment.URLS}/users/profile`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  // Métodos para manejo de direcciones
  getAddresses(): Observable<any> {
    return this.http.get<any>(`${environment.URLS}/users/addresses`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  createAddress(address: any): Observable<any> {
    // El token JWT solo contiene email, necesitamos enviar user_id
    const payload = {
      ...address,
      user_id: 123, // ID temporal hasta que el backend incluya user_id en el token
    };

    return this.http.post<any>(`${environment.URLS}/users/addresses`, payload, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  updateAddress(address: any, id: number): Observable<any> {
    // El token JWT solo contiene email, necesitamos enviar user_id
    const payload = {
      ...address,
      user_id: 123, // ID temporal hasta que el backend incluya user_id en el token
    };

    return this.http.put<any>(
      `${environment.URLS}/users/addresses/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
  }

  deleteAddress(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.URLS}/users/addresses/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }
}
