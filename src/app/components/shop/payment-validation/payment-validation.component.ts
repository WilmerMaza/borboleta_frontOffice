import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { WompiService } from '../../../shared/services/wompi.service';
import { ClearCart } from '../../../shared/store/action/cart.action';
import { GetOrders } from '../../../shared/store/action/order.action';
import { LoaderComponent } from '../../../shared/components/widgets/loader/loader.component';

@Component({
  selector: 'app-payment-validation',
  imports: [CommonModule, LoaderComponent],
  templateUrl: './payment-validation.component.html',
  styleUrl: './payment-validation.component.scss'
})
export class PaymentValidationComponent {
  public status: 'validating' | 'success' | 'error' | 'pending' = 'validating';
  public message = 'Validando tu pago...';
  public loading = true;
  public isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private wompiService: WompiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    const params = this.route.snapshot.queryParams;
    const reference = params['reference'];
    const status = params['status'];

    if (!reference) {
      this.status = 'error';
      this.message = 'No se encontró referencia de pago';
      this.loading = false;
      setTimeout(() => this.router.navigate(['/checkout']), 5000);
      return;
    }

    // Verificar si la orden fue creada por el webhook
    this.verifyOrder(reference, status);
  }

  /**
   * Verifica que la orden fue creada por el webhook de Wompi
   * La orden YA DEBE existir en el backend porque el webhook la creó
   */
  private verifyOrder(reference: string, status?: string) {
    this.status = 'validating';
    this.message = 'Verificando tu pago...';
    this.loading = true;

    // Si el status indica que fue rechazado, no verificar
    if (status === 'DECLINED') {
      this.status = 'error';
      this.message = 'El pago fue rechazado. Por favor intenta nuevamente.';
      this.loading = false;
      setTimeout(() => this.router.navigate(['/checkout']), 5000);
      return;
    }

    // Verificar que la orden existe (el webhook ya la creó)
    // La respuesta tiene: { success: true, data: { reference, status, id, ... } }
    this.wompiService.verifyByReference(reference).subscribe({
      next: (res) => {
        // Verificar si el pago fue aprobado (res.data.status === 'APPROVED')
        if (res.success && res.data?.status === 'APPROVED') {
          // El pago fue aprobado y el webhook ya creó la orden
          this.store.dispatch(new ClearCart());
          localStorage.removeItem(`temp_order_${reference}`);
          localStorage.removeItem('pending_checkout');
          localStorage.removeItem('wompi_payment_link_id');

          // Recargar órdenes y redirigir
          this.store.dispatch(new GetOrders({ page: 1, paginate: 10 })).subscribe(() => {
            this.status = 'success';
            this.message = '¡Orden creada exitosamente!';
            this.loading = false;
            setTimeout(() => {
              this.router.navigate(['/account/order'], { 
                queryParams: { order_created: 'true' },
                replaceUrl: true
              });
            }, 1000);
          });
        } else if (res.data?.isPending) {
          // La orden está pendiente (webhook no ha llegado aún)
          this.status = 'pending';
          this.message = 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.';
          this.loading = false;
          
          // Limpiar carrito aunque esté pendiente
          this.store.dispatch(new ClearCart());
          localStorage.removeItem(`temp_order_${reference}`);
          localStorage.removeItem('pending_checkout');
          localStorage.removeItem('wompi_payment_link_id');
          
          // Redirigir a órdenes después de un tiempo
          setTimeout(() => {
            this.router.navigate(['/account/order'], { replaceUrl: true });
          }, 5000);
        } else {
          // No se encontró la orden o el pago no fue aprobado
          this.status = 'error';
          this.message = res.message || 'No se encontró la orden. Por favor contacta a soporte.';
          this.loading = false;
          setTimeout(() => this.router.navigate(['/checkout']), 5000);
        }
      },
      error: (err) => {
        this.status = 'error';
        this.message = err.error?.message || 'Error al verificar la orden';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/checkout']), 5000);
      }
    });
  }
}

