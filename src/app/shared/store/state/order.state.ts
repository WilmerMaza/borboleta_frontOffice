import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { tap } from "rxjs";
import { Store } from "@ngxs/store";
import { of } from "rxjs";

import { Order, OrderCheckout } from "../../interface/order.interface";

import { NotificationService } from "../../services/notification.service";
import { OrderService } from "../../services/order.service";

import { Checkout, DownloadInvoice, GetOrders, OrderTracking, PlaceOrder, RePayment, ViewOrder } from "../action/order.action";

export class OrderStateModel {
  order = {
    data: [] as Order[],
    total: 0
  }
  selectedOrder: Order | null
  checkout: OrderCheckout | null
}

@State<OrderStateModel>({
  name: "order",
  defaults: {
    order: {
      data: [],
      total: 0
    },
    selectedOrder: null,
    checkout: null
  },
})
@Injectable()
export class OrderState {

  constructor(private notificationService: NotificationService,
    private router: Router,
    private orderService: OrderService,
    private store: Store) {}

  @Selector()
  static order(state: OrderStateModel) {
    return state.order;
  }

  @Selector()
  static selectedOrder(state: OrderStateModel) {
    return state.selectedOrder;
  }

  @Selector()
  static checkout(state: OrderStateModel) {
    return state.checkout;
  }

  @Action(GetOrders)
  getOrders(ctx: StateContext<OrderStateModel>, action: GetOrders) {
    return this.orderService.getOrders(action?.payload).pipe(
      tap({
        next: result => {
          ctx.patchState({
            order: {
              data: result.data,
              total: result?.total ? result?.total : result.data?.length
            }
          });
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(ViewOrder)
  viewOrder(ctx: StateContext<OrderStateModel>, { id }: ViewOrder) {
    this.orderService.skeletonLoader = true;
    return this.orderService.getOrders().pipe(
      tap({
        next: results => {
          if(results && results.data) {
            const state = ctx.getState();
            const result = results.data.find(order => order.order_number == id);
            ctx.patchState({
              ...state,
              selectedOrder: result
            });
          }
        },
        error: err => {
          throw new Error(err?.error?.message);
        },
        complete: () => {
          this.orderService.skeletonLoader = false;
        }
      })
    );
  }

  @Action(Checkout)
  checkout(ctx: StateContext<OrderStateModel>, action: Checkout) {
    const state = ctx.getState();

    // JSON estático para checkout
    const order = {
      total: {
        convert_point_amount: 65.66,
        convert_wallet_balance: 8.47,
        coupon_total_discount: 10,
        points: 1970,
        points_amount: 65.66,
        shipping_total: 0,
        sub_total: 39.81,
        tax_total: 1.99,
        total: 41.80,
        wallet_balance: 8.47,
      }
    };

    ctx.patchState({
      ...state,
      checkout: order
    });
  }

  @Action(PlaceOrder)
  placeOrder(ctx: StateContext<OrderStateModel>, action: PlaceOrder) {
    // JSON estático para crear orden
    const mockOrder = {
      success: true,
      data: {
        id: Math.floor(Math.random() * 1000) + 1000,
        order_number: Math.floor(Math.random() * 9000) + 1000,
        payment_status: 'PENDING',
        total: 41.80
      },
      message: 'Orden creada exitosamente'
    };

    // Simular delay de red
    setTimeout(() => {
      this.notificationService.showSuccess('Orden creada exitosamente');
      this.router.navigate(['/order-success'], { 
        queryParams: { order_id: mockOrder.data.id } 
      });
    }, 1000);

    return of(mockOrder);
  }

  @Action(RePayment)
  rePayment(ctx: StateContext<OrderStateModel>, action: RePayment) {
    // Repayment Logic Here
  }

  @Action(OrderTracking)
  orderTracking(ctx: StateContext<OrderStateModel>, action: OrderTracking) {
    // this.notificationService.notification = false;
    return this.orderService.orderTracking(action.payload).pipe(
      tap({
        next: result => {
          const state = ctx.getState();
          ctx.patchState({
            ...state,
            selectedOrder: result
          });
        },
        error: err => {
          throw new Error(err?.error?.message);
        }
      })
    );
  }

  @Action(DownloadInvoice)
  downloadInvoice(ctx: StateContext<OrderStateModel>, action: DownloadInvoice) {
    // Download invoice Logic Here
  }

}
