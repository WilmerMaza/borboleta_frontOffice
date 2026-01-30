import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Store } from "@ngxs/store";
import { ErrorService } from "../../shared/services/error.service";
import { LoggingService } from "../../shared/services/logging.service";
import { NotificationService } from "../../shared/services/notification.service";
import { AuthState } from "../../shared/store/state/auth.state";
import { Observable, catchError, of, throwError } from "rxjs";

@Injectable()
export class GlobalErrorHandlerInterceptor implements HttpInterceptor {
  private store = inject(Store);

  constructor(
    private errorService: ErrorService,
    private logger: LoggingService,
    private notifier: NotificationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Silenciar 401 cuando el usuario no tiene token (navegación sin login).
        // No silenciar 401 en login/registro para que el formulario pueda mostrar "credenciales incorrectas".
        const isAuthEndpoint = request.url.includes('/login') || request.url.includes('/register');
        if (error.status === 401 && !isAuthEndpoint) {
          let token = this.store.selectSnapshot(AuthState.accessToken);

          if (!token && typeof window !== 'undefined') {
            try {
              const authStorage = localStorage.getItem('auth');
              if (authStorage) {
                const authData = JSON.parse(authStorage);
                token = authData?.access_token || null;
              }
            } catch (e) {
              // Ignorar errores al parsear
            }
          }

          if (!token) {
            // Usuario no logueado: no mostrar "token requerido" al navegar
            return of(null);
          }
          // Con token, el AuthInterceptor ya maneja sesión expirada; no mostrar toast duplicado
          return of(null);
        }

        // Handle HTTP errors here
        const errorMessage = this.errorService.getClientErrorMessage(error.error);
        this.logger.logError(errorMessage);
        this.notifier.showError(errorMessage);

        // Rethrow the error to propagate it down the error handling chain
        return throwError(() => error)
      })
    );
  }
}
