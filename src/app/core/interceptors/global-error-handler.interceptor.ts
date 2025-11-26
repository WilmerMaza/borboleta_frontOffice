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
        // Solo ignorar errores 401 del endpoint /users/profile cuando NO hay token
        // Si hay token y falla, el AuthInterceptor se encarga de cerrar la sesión
        if (error.status === 401 && request.url.includes('/users/profile')) {
          let token = this.store.selectSnapshot(AuthState.accessToken);
          
          // Si no hay token en el estado, verificar localStorage como fallback
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
            // No hay token, es un error esperado - silenciarlo completamente
            return of(null);
          }
          // Si hay token, dejar que el AuthInterceptor maneje el cierre de sesión
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
