import { Component, inject } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { OrderState } from '../../../shared/store/state/order.state';
import { Observable } from 'rxjs';
import { OrderModel } from '../../../shared/interface/order.interface';
import { Params, RouterModule } from '@angular/router';
import { GetOrders } from '../../../shared/store/action/order.action';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencySymbolPipe } from '../../../shared/pipe/currency.pipe';
import { PaginationComponent } from '../../../shared/components/widgets/pagination/pagination.component';
import { NoDataComponent } from '../../../shared/components/widgets/no-data/no-data.component';

@Component({
    selector: 'app-orders',
    imports: [CommonModule, TranslateModule, RouterModule,
        CurrencySymbolPipe, PaginationComponent, NoDataComponent],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent {

  order$: Observable<OrderModel> = inject(Store).select(OrderState.order) as Observable<OrderModel>;

  public filter: Params = {
    'page': 1, // Current page number
    'paginate': 10, // Display per page,
  };

  constructor(private store: Store) {
    this.store.dispatch(new GetOrders(this.filter));
    
    // Debug: verificar los datos de las órdenes
    this.order$.subscribe(orders => {
      if (orders?.data?.length > 0) {
        console.log('📦 === ÓRDENES OBTENIDAS === 📦');
        console.log('📋 Total de órdenes:', orders.data.length);
        orders.data.forEach((order, index) => {
          console.log(`📦 Orden ${index + 1}:`, {
            order_number: order.order_number,
            created_at: order.created_at,
            total: order.total,
            payment_status: order.payment_status
          });
        });
      }
    });
  }

  setPaginate(page: number) {
    this.filter['page'] = page;
    this.store.dispatch(new GetOrders(this.filter));
  }

}
