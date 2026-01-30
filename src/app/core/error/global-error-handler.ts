import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngxs/store';

import { LoggingService } from '../../shared/services/logging.service';
import { ErrorService } from '../../shared/services/error.service';
import { NotificationService } from '../../shared/services/notification.service';
import { AuthState } from '../../shared/store/state/auth.state';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

    // Error handling is important and needs to be loaded first.
    // Because of this we should manually inject the services with Injector.
    constructor(private injector: Injector) { }

    handleError(error: Error | HttpErrorResponse) {
        const errorService = this.injector.get(ErrorService);
        const logger = this.injector.get(LoggingService);
        const notifier = this.injector.get(NotificationService);
        const store = this.injector.get(Store);

        // Silenciar 401 cuando el usuario no tiene token (navegación sin login).
        // No silenciar 401 en login/registro para que el formulario pueda mostrar "credenciales incorrectas".
        const isAuthEndpoint = error.url?.includes('/login') || error.url?.includes('/register');
        if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
          let token = store.selectSnapshot(AuthState.accessToken);

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
            return;
          }
          // Con token, el AuthInterceptor ya maneja sesión expirada; no mostrar mensaje duplicado
          return;
        }

        let message;

        if (error instanceof HttpErrorResponse) {
          // Server error
          message = errorService.getServerErrorMessage(error);
          notifier.showError(message);
        } else {
          // Client Error
          message = errorService.getClientErrorMessage(error);
          notifier.showError(message);
        }
        // Always log errors
        logger.logError(message);
    }

}
