import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { AccountUser } from '../interface/account.interface';
import { Store } from '@ngxs/store';
import { AuthState } from '../store/state/auth.state';

@Injectable({
  providedIn: 'root'
})
export class AccountService {

  public isOpenMenu: boolean = false;

  constructor(
    private http: HttpClient,
    private store: Store
  ) {}

  getUserDetails(): Observable<any> {
    // Solo cargar datos del usuario si hay un token válido
    const accessToken = this.store.selectSnapshot(AuthState.accessToken);
    
    if (!accessToken) {
      // Si no hay token, retornar null para evitar cargar datos pre-definidos
      return of(null);
    }
    
    return this.http.get<AccountUser>(`${environment.URL}/self.json`);
  }
 
}
