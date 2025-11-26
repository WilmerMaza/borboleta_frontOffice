import { Component, inject, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { OrderState } from '../../../shared/store/state/order.state';
import { Observable } from 'rxjs';
import { OrderModel } from '../../../shared/interface/order.interface';
import { Params, RouterModule, ActivatedRoute, Router } from '@angular/router';
import { GetOrders } from '../../../shared/store/action/order.action';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencySymbolPipe } from '../../../shared/pipe/currency.pipe';
import { PaginationComponent } from '../../../shared/components/widgets/pagination/pagination.component';
import { NoDataComponent } from '../../../shared/components/widgets/no-data/no-data.component';
import { WompiService } from '../../../shared/services/wompi.service';
import { ClearCart } from '../../../shared/store/action/cart.action';

@Component({
    selector: 'app-orders',
    imports: [CommonModule, TranslateModule, RouterModule,
        CurrencySymbolPipe, PaginationComponent, NoDataComponent],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {

  order$: Observable<OrderModel> = inject(Store).select(OrderState.order) as Observable<OrderModel>;

  public filter: Params = {
    'page': 1, // Current page number
    'paginate': 10, // Display per page,
  };

  constructor(
    private store: Store, 
    private route: ActivatedRoute, 
    private router: Router,
    private wompiService: WompiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
  }

  ngOnInit() {
    const isBrowser = isPlatformBrowser(this.platformId);
    
    // Si se viene de una transacción finalizada, recargar las órdenes primero
    this.route.queryParams.subscribe(params => {
      const reference = params['reference'];
      
      // Si viene reference de Wompi, verificar que la orden existe
      if (reference && isBrowser) {
        this.verifyWompiOrder(reference);
        return;
      }
      
      if (params['order_created'] === 'true') {
        // Recargar inmediatamente
        this.store.dispatch(new GetOrders(this.filter));
        
        // Recargar después de un delay corto para asegurar que el backend procesó la orden
        setTimeout(() => {
          this.store.dispatch(new GetOrders(this.filter));
        }, 1500);
        
        // Recargar nuevamente después de más tiempo por si acaso
        setTimeout(() => {
          this.store.dispatch(new GetOrders(this.filter));
        }, 4000);
        
        // Limpiar el query param después de procesarlo
        setTimeout(() => {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }, 5000);
      } else {
        // Cargar órdenes normalmente si no hay nueva orden
        this.store.dispatch(new GetOrders(this.filter));
      }
    });
  }

  /**
   * Verifica el estado de la orden creada por el webhook de Wompi
   * IMPORTANTE: Solo consulta el estado, NO crea la orden
   * La orden ya fue creada automáticamente por el webhook cuando el pago fue aprobado
   * 
   * Flujo:
   * 1. Webhook de Wompi → crea la orden automáticamente cuando status === 'APPROVED'
   * 2. Wompi redirige a /account/order?reference=XXX
   * 3. Este método solo verifica si la orden existe y limpia el carrito
   */
  private verifyWompiOrder(reference: string) {
    // Solo consultar el estado - la orden ya fue creada por el webhook
    this.wompiService.verifyByReference(reference).subscribe({
      next: (res) => {
        // Si el pago fue aprobado, la orden ya fue creada por el webhook
        // Solo necesitamos limpiar el carrito y recargar las órdenes
        if (res.success && res.data?.status === 'APPROVED') {
          // Limpiar carrito y datos temporales
          this.store.dispatch(new ClearCart());
          localStorage.removeItem(`temp_order_${reference}`);
          localStorage.removeItem('pending_checkout');
          localStorage.removeItem('wompi_payment_link_id');
          
          // Recargar órdenes para mostrar la nueva orden creada por el webhook
          this.store.dispatch(new GetOrders(this.filter));
          setTimeout(() => {
            this.store.dispatch(new GetOrders(this.filter));
          }, 1000);
          setTimeout(() => {
            this.store.dispatch(new GetOrders(this.filter));
          }, 3000);
          
          // Limpiar el query param
          setTimeout(() => {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true
            });
          }, 5000);
        } else {
          // Recargar órdenes de todas formas
          this.store.dispatch(new GetOrders(this.filter));
        }
      },
      error: (err) => {
        // Aún así recargar órdenes
        this.store.dispatch(new GetOrders(this.filter));
      }
    });
  }

  setPaginate(page: number) {
    this.filter['page'] = page;
    this.store.dispatch(new GetOrders(this.filter));
  }

}
