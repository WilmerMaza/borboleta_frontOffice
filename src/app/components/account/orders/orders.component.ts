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
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-orders',
    imports: [CommonModule, TranslateModule, RouterModule,
        CurrencySymbolPipe, PaginationComponent, NoDataComponent],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent {

  order$: Observable<OrderModel> = inject(Store).select(OrderState.order).pipe(
    tap((orders) => {
      if (orders?.data && orders.data.length > 0) {
        console.log('OrdersComponent - First order complete object:', orders.data[0]);
        console.log('OrdersComponent - First order keys:', Object.keys(orders.data[0]));
        console.log('OrdersComponent - First order created_at:', orders.data[0].created_at);
        console.log('OrdersComponent - First order id:', orders.data[0].id);
        console.log('OrdersComponent - First order order_number:', orders.data[0].order_number);
      }
    })
  ) as Observable<OrderModel>;

  public filter: Params = {
    'page': 1, // Current page number
    'paginate': 10, // Display per page,
  };

  constructor(private store: Store) {
    console.log('OrdersComponent constructor - Dispatching GetOrders with filter:', this.filter);
    this.store.dispatch(new GetOrders(this.filter));
  }

  setPaginate(page: number) {
    this.filter['page'] = page;
    this.store.dispatch(new GetOrders(this.filter));
  }

}
