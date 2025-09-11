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

  constructor(private store: Store,
    private route: ActivatedRoute,
    private modal: NgbModal,
    private datePipe: DatePipe,
    private location: Location) {
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
        // Calcular totales si están en 0 (temporal hasta que se corrija el backend)
        if (order && (order.total === 0 || order.amount === 0)) {
          this.calculateOrderTotals(order);
        }
        
        this.order = order!;
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
    // Obtener el estado del carrito desde el store
    const cartState = this.store.selectSnapshot(state => state.cart);
    
    if (cartState && cartState.items && cartState.items.length > 0) {
      // Usar los datos del carrito local para calcular los totales
      const cartTotal = cartState.total || 0;
      const cartItems = cartState.items || [];
      
      // Actualizar los totales de la orden con los datos del carrito
      order.amount = cartTotal;
      order.total = cartTotal + (order.shipping_total || 0) + (order.tax_total || 0);
      
      // Actualizar los productos con los datos del carrito
      if (order.products && order.products.length > 0) {
        order.products.forEach((orderProduct, index) => {
          const cartItem = cartItems.find((item: any) => item.product_id === orderProduct.id);
          if (cartItem && orderProduct.pivot) {
            // Usar los datos del carrito para actualizar el pivot
            orderProduct.pivot.single_price = cartItem.sub_total / cartItem.quantity;
            orderProduct.pivot.subtotal = cartItem.sub_total;
            orderProduct.pivot.quantity = cartItem.quantity;
            
            // Actualizar el nombre del producto desde el carrito
            if (cartItem.product && cartItem.product.name) {
              orderProduct.name = cartItem.product.name;
            }
          }
        });
      }
    } else {
      // Fallback: usar los precios del producto si no hay carrito
      let subtotal = 0;
      if (order.products && order.products.length > 0) {
        order.products.forEach(product => {
          if (product.pivot) {
            const price = product.sale_price || product.price || 0;
            const quantity = product.pivot.quantity || 1;
            const productSubtotal = price * quantity;
            
            product.pivot.single_price = price;
            product.pivot.subtotal = productSubtotal;
            
            subtotal += productSubtotal;
          }
        });
      }
      
      order.amount = subtotal;
      order.total = subtotal + (order.shipping_total || 0) + (order.tax_total || 0);
    }
  }
}
