import {
  HttpErrorResponse,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { inject, Injectable, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { Select, Store } from "@ngxs/store";
import { Observable, of, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { Values } from "../../shared/interface/setting.interface";
import { NotificationService } from "../../shared/services/notification.service";
import { AuthClear } from "../../shared/store/action/auth.action";
import { SettingState } from "../../shared/store/state/setting.state";
import { AuthService } from "../../shared/services/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  setting$: Observable<Values> = inject(Store).select(
    SettingState.setting
  ) as Observable<Values>;

  public isMaintenanceModeOn: boolean = false;

  constructor(
    private store: Store,
    private router: Router,
    private ngZone: NgZone,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {
    this.setting$.subscribe((setting) => {
      this.isMaintenanceModeOn = setting?.maintenance?.maintenance_mode!;
    });
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    // If Maintenance Mode On
    if (this.isMaintenanceModeOn) {
      this.ngZone.run(() => {
        this.router.navigate(["/maintenance"]);
      });
      // End the interceptor chain if in maintenance mode
    }

    // Obtener el token del estado de NGXS
    let token = this.store.selectSnapshot(
      (state) => state.auth?.access_token
    );

    // Si no hay token en el estado, intentar obtenerlo de localStorage como fallback
    // Esto puede pasar durante la carga inicial antes de que NGXSStoragePlugin cargue el estado
    if ((!token || token === "" || token === null) && typeof window !== 'undefined') {
      try {
        const authStorage = localStorage.getItem('auth');
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          token = authData?.access_token || null;
        }
      } catch {
        // ignorar errores al parsear
      }
    }
    if (!token || token === '' || token === null) {
      token = this.store.selectSnapshot((state) => state.auth?.access_token) ?? null;
    }

    // Enviar el token en el header: Authorization: Bearer <tu_token>
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo manejar 401 si realmente hay un token (indica que expiró o es inválido)
        // Esto aplica para TODAS las peticiones, no solo /users/profile
        if (error.status === 401 && token) {
          // Token expired or invalid - cerrar sesión completamente
          this.ngZone.run(() => {
            // Limpiar localStorage
            if (typeof window !== 'undefined') {
              try {
                localStorage.removeItem('auth');
                localStorage.removeItem('account');
              } catch (e) {
                // Ignorar errores al limpiar localStorage
              }
            }
            
            // Limpiar el estado de autenticación y cuenta
            this.notificationService.notification = false;
            this.store.dispatch(new AuthClear());
            
            // Abrir modal de login
            this.authService.isLogin = true;
            
            // Redirigir a la página principal
            this.router.navigate(['/']);
          });
        }
        return throwError(() => error);
      })
    );
  }
}
