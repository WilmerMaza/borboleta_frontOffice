import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { UrlTree, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { mapTo, catchError } from 'rxjs/operators';
import { GetUserDetails } from './../../shared/store/action/account.action';
import { AuthService } from './../../shared/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class CheckoutGuard {

  constructor(
    private store: Store,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | boolean | UrlTree {

    // Guardar la URL a la que quería ir, por si luego inicia sesión
    this.authService.redirectUrl = state.url;

    // Leer el token actual
    const accessToken = this.store.selectSnapshot(s => s.auth && s.auth.access_token);

    // Si NO hay token → dejar entrar igual
    if (!accessToken) {
      return true;
    }

    // Si HAY token → cargar detalles del usuario antes (o durante) la navegación
    return this.store.dispatch(new GetUserDetails()).pipe(
      mapTo(true),          // si todo va bien, se permite
      catchError(() => of(true)) // si falla igual se deja pasar, para no bloquear checkout
    );
  }
}
