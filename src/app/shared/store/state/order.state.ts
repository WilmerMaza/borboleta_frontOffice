import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { tap } from "rxjs";

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

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private orderService: OrderService,
    private store: Store
  ) {}

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
    return this.orderService.getOrders({ id }).pipe(
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

    // Obtener valores del estado actual del store
    const currentState = this.store.selectSnapshot(state => state);
    const user = currentState.account?.user;
    const coupon = currentState.coupon?.coupon;
    const cartItems = currentState.cart?.items || [];
    
    // Calcular subtotal usando los productos reales del carrito
    const sub_total = cartItems.reduce((acc: number, item: any) => acc + Number(item.sub_total || 0), 0);
    
    // Calcular impuestos (ejemplo: 5% del subtotal)
    const tax_total = sub_total * 0.05;
    
    // Calcular envío (ejemplo: gratis si el subtotal es mayor a X, sino $5)
    const shipping_total = sub_total > 50 ? 0 : 5;
    
    // Obtener descuento del cupón aplicado
    const coupon_total_discount = coupon?.discount || 0;
    
    // Obtener puntos y wallet del usuario
    const points_amount = action.payload?.points_amount ? Number(user?.point?.balance || 0) : 0;
    const wallet_balance = action.payload?.wallet_balance ? Number(user?.wallet?.balance || 0) : 0;
    const points = Number(user?.point?.balance || 0);

    const total = sub_total + tax_total + shipping_total - coupon_total_discount - points_amount - wallet_balance;

    const order = {
      total: {
        convert_point_amount: points_amount,
        convert_wallet_balance: wallet_balance,
        coupon_total_discount: coupon_total_discount,
        points: points,
        points_amount: points_amount,
        shipping_total: shipping_total,
        sub_total: sub_total,
        tax_total: tax_total,
        total: total,
        wallet_balance: wallet_balance,
      }
    };

    ctx.patchState({
      ...state,
      checkout: order
    });
  }

  @Action(PlaceOrder)
  placeOrder(ctx: StateContext<OrderStateModel>, action: PlaceOrder) {
    return this.orderService.createOrder(action.payload).pipe(
      tap({
        next: (order) => {
          this.notificationService.showSuccess('¡Pedido realizado con éxito!');
          this.router.navigate(['/account/order']);
        },
        error: (err) => {
          this.notificationService.showError('Error al realizar el pedido');
          throw new Error(err?.error?.message);
        }
      })
    );
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