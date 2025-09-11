import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { UpdatePasswordState, AuthForgotPasswordState, AuthStateModal, AuthUserState, AuthVerifyOTPState, RegisterModal, AuthNumberLoginState, AuthVerifyNumberOTPState } from '../interface/auth.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public redirectUrl: string | undefined;
  public confirmed: boolean = false;
  public isLogin: boolean = false;

  constructor(private http: HttpClient) { }

  // Método de registro
  register(payload: RegisterModal): Observable<any> {
    console.log('🚀 === ENVIANDO REGISTRO AL BACKEND === 🚀');
    console.log('📦 Payload de registro:', payload);
    console.log('🌐 URL:', `${environment.URLS}/users/register`);
    
    return this.http.post<any>(`${environment.URLS}/users/register`, payload);
  }

  // Método de login
  login(payload: AuthUserState): Observable<any> {
    console.log('🔐 === ENVIANDO LOGIN AL BACKEND === 🔐');
    console.log('📦 Payload de login:', payload);
    console.log('🌐 URL:', `${environment.URLS}/users/login`);
    console.log('📋 Headers enviados:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    return this.http.post<any>(`${environment.URLS}/users/login`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }
}

