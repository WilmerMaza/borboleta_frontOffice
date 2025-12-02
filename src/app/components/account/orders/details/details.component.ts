import { CommonModule, DatePipe, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, mergeMap, of, switchMap, takeUntil } from 'rxjs';
import { PayModalComponent } from '../../../../shared/components/widgets/modal/pay-modal/pay-modal.component';
import { RefundModalComponent } from '../../../../shared/components/widgets/modal/refund-modal/refund-modal.component';
import { OrderStatusModel } from '../../../../shared/interface/order-status.interface';
import { Order } from '../../../../shared/interface/order.interface';
import { Product } from '../../../../shared/interface/product.interface';
import { CurrencySymbolPipe } from '../../../../shared/pipe/currency.pipe';
import { GetOrderStatus } from '../../../../shared/store/action/order-status.action';
import { DownloadInvoice, ViewOrder } from '../../../../shared/store/action/order.action';
import { OrderStatusState } from '../../../../shared/store/state/order-status.state';
import { OrderState } from '../../../../shared/store/state/order.state';
import { TextConverterPipe } from '../../../../shared/pipe/text-converter.pipe';

@Component({
    selector: 'app-details',
    imports: [CommonModule, TranslateModule, RouterModule,
        CurrencySymbolPipe, NgbModule, TextConverterPipe],
    providers: [DatePipe],
    templateUrl: './details.component.html',
    styleUrl: './details.component.scss'
})
export class DetailsComponent {

  orderStatus$: Observable<OrderStatusModel> = inject(Store).select(OrderStatusState.orderStatus);

  private destroy$ = new Subject<void>();

  public order: Order;
  public isLogin: boolean;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private modal: NgbModal,
    private datePipe: DatePipe,
    private location: Location
  ) {
    this.store.dispatch(new GetOrderStatus());
  }

  ngOnInit() {
    this.isLogin = !!this.store.selectSnapshot(state => state.auth && state.auth.access_token)
    this.route.params
      .pipe(
        switchMap(params => {
            if(!params['id']) return of();
            return this.store
                      .dispatch(new ViewOrder(params['id']))
                      .pipe(mergeMap(() => this.store.select(OrderState.selectedOrder)))
          }
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(order => {
        if (order) {
          // Siempre calcular los totales para asegurar que se muestren correctamente
          this.calculateOrderTotals(order);
          this.order = order;
        }
        if(this.order && this.order?.order_status_activities){
          this.order?.order_status_activities?.map(actStatus => {
            this.orderStatus$.subscribe(res => {
              res.data.map(status => {
                if(actStatus.status == status.name){
                  let convertDate = this.datePipe.transform(actStatus?.changed_at, 'dd MMM yyyy hh:mm:a')!
                  status['activities_date'] = convertDate;
                }
              })
            })
          })
        }
      });
  }

  openPayModal(order: Order){
    const modal = this.modal.open(PayModalComponent, { centered: true });
    modal.componentInstance.orderDetails = order;
  }

  openRefundModal(product: Product, order_id: number){
    const modal = this.modal.open(RefundModalComponent, { centered: true, windowClass: 'theme-modal-2 refund-modal' });
    modal.componentInstance.productDetails = product;
    modal.componentInstance.orderId = order_id;
  }

  download(id: number){
    this.store.dispatch(new DownloadInvoice({order_number: id}))
  }

  back(){
    this.location.back();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Calcula los totales de la orden usando los datos del carrito local
   * @param order - La orden a calcular
   */
  private calculateOrderTotals(order: Order) {
    console.log('🔧 === CALCULANDO TOTALES === 🔧');
    console.log('📦 Orden recibida:', {
      total: order.total,
      amount: order.amount,
      tax_total: order.tax_total,
      shipping_total: order.shipping_total,
      products_count: order.products?.length
    });
    
    if (order.products?.length > 0) {
      // Calcular subtotal si amount está en 0
      if (order.amount === 0) {
        const subtotal = order.total - (order.tax_total || 0) - (order.shipping_total || 0);
        order.amount = subtotal;
        console.log('💰 Subtotal calculado:', subtotal);
      }
      
      // Actualizar precios de productos si están en 0
      order.products.forEach((product, index) => {
        if (product.pivot) {
          if (product.pivot.single_price === 0 || product.pivot.subtotal === 0) {
            const subtotal = order.amount || (order.total - (order.tax_total || 0) - (order.shipping_total || 0));
            product.pivot.single_price = subtotal / product.pivot.quantity;
            product.pivot.subtotal = subtotal;
            console.log(`📦 Producto ${index + 1} actualizado:`, {
              single_price: product.pivot.single_price,
              subtotal: product.pivot.subtotal,
              quantity: product.pivot.quantity
            });
          }
        }
      });
    }
    
    // Actualizar nombre del producto desde el carrito si está vacío
    const cartState = this.store.selectSnapshot(state => state.cart);
    if (cartState?.items?.length > 0 && order.products?.length > 0) {
      order.products.forEach(orderProduct => {
        if (!orderProduct.name || orderProduct.name === '') {
          const cartItem = cartState.items.find((item: any) => item.product_id === orderProduct.id);
          if (cartItem?.product?.name) {
            orderProduct.name = cartItem.product.name;
            console.log('📝 Nombre actualizado desde carrito:', orderProduct.name);
          }
        }
      });
    }
  }
}
