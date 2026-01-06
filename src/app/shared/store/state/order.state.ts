import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { map, tap } from "rxjs";

import { Order, OrderCheckout } from "../../interface/order.interface";

import { NotificationService } from "../../services/notification.service";
import { OrderService } from "../../services/order.service";

import { Checkout, DownloadInvoice, GetOrders, OrderTracking, PlaceOrder, RePayment, ViewOrder } from "../action/order.action";
import { ClearCart } from "../action/cart.action";

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

    const currentState = this.store.selectSnapshot(s => s);
    const user = currentState.account?.user;
    const coupon = currentState.coupon?.coupon;

    // 👇 PRIORIDAD: Usar productos del payload (que vienen del componente con sub_total)
    // Si no vienen, fallback al store
    const itemsSource: any[] = action.payload?.products || [];
    const items = itemsSource.length ? itemsSource : (currentState.cart?.items || []);

    // Calcular subtotal: priorizar sub_total del payload, sino calcular desde precios
    const sub_total = items.reduce((acc: number, item: any) => {
      let itemSubTotal = Number(item.sub_total || 0);

      // Si no trae sub_total, intenta calcularlo desde price
      if (!itemSubTotal) {
        const price =
          item.single_price ??
          (item.variation
            ? (item.variation.sale_price || item.variation.price || 0)
            : (item.wholesale_price ||
               item.product?.sale_price ||
               item.product?.price ||
               0));

        itemSubTotal = price * (item.quantity || 1);
      }

      return acc + itemSubTotal;
    }, 0);

    // Calcular impuestos (19%)
    const tax_total = sub_total * 0.19;

    // Calcular envío: si el carrito es digital solo, no hay envío
    // Si no es digital, aplicar lógica: > 50,000 COP = gratis, sino 5,000 COP
    // Verificar is_digital_only desde el payload o desde localStorage si está disponible
    let isDigitalOnly = false;
    if (typeof window !== 'undefined') {
      try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
          const cart = JSON.parse(cartData);
          isDigitalOnly = cart.is_digital_only || false;
        }
      } catch (e) {
        isDigitalOnly = currentState.cart?.is_digital_only || false;
      }
    } else {
      isDigitalOnly = currentState.cart?.is_digital_only || false;
    }

    const shipping_total = isDigitalOnly ? 0 : (sub_total > 50000 ? 0 : 5000);

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
      map((response: any) => {
        // Manejar diferentes estructuras de respuesta
        // Puede ser: { data: order }, { success: true, data: order }, o directamente order
        const order = response?.data || response?.order || response;
        
        // Guardar la orden en el estado para que el componente pueda acceder a ella
        ctx.patchState({
          selectedOrder: order
        });
        
        this.notificationService.showSuccess('¡Pedido realizado con éxito!');
        
        // Limpiar el carrito después de completar la orden
        this.store.dispatch(new ClearCart());
        
        // NO redirigir aquí - dejar que el componente maneje la navegación/modal
        // this.router.navigate(['/account/order']);
        
        // Retornar la orden para que el componente pueda usarla
        return order;
      }),
      tap({
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