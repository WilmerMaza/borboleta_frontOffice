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

        // Solo ignorar errores 401 del endpoint /users/profile cuando NO hay token
        // Si hay token y falla, el AuthInterceptor se encarga de cerrar la sesión
        if (error instanceof HttpErrorResponse && 
            error.status === 401 && 
            error.url?.includes('/users/profile')) {
          let token = store.selectSnapshot(AuthState.accessToken);
          
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
            return;
          }
          // Si hay token, dejar que el AuthInterceptor maneje el cierre de sesión
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
