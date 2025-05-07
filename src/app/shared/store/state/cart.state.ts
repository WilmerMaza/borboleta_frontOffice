import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { of, tap } from "rxjs";
import { Cart, CartModel } from "../../interface/cart.interface";
import { CartService } from "../../services/cart.service";
import { NotificationService } from "../../services/notification.service";
import {
  AddToCart, AddToCartLocalStorage, ClearCart, CloseStickyCart, DeleteCart,
  GetCartItems, ReplaceCart, SyncCart, ToggleSidebarCart, UpdateCart
} from "../action/cart.action";

export interface CartStateModel {
  items: Cart[];
  total: number;
  is_digital_only: boolean | number | null;
  stickyCartOpen: boolean;
  sidebarCartOpen: boolean;
}

@State<CartStateModel>({
  name: "cart",
  defaults: {
    items: [],
    total: 0,
    is_digital_only: null,
    stickyCartOpen: false,
    sidebarCartOpen: false
  },
})
@Injectable()
export class CartState {

  constructor(
    private cartService: CartService,
    private notificationService: NotificationService,
    private store: Store
  ) {}

  ngxsOnInit(ctx: StateContext<CartStateModel>) {
    const stored = localStorage.getItem('cart');
    if (stored) {
      const cart = JSON.parse(stored);
      ctx.patchState(cart);
    }
    ctx.dispatch(new ToggleSidebarCart(false));
    ctx.dispatch(new CloseStickyCart());
  }

  private saveCartToStorage(state: CartStateModel) {
    localStorage.setItem('cart', JSON.stringify(state));
  }

  private removeCartFromStorage() {
    localStorage.removeItem('cart');
  }

  @Selector()
  static cartItems(state: CartStateModel) {
    return state.items;
  }

  @Selector()
  static cartTotal(state: CartStateModel) {
    return state.total;
  }

  @Selector()
  static cartHasDigital(state: CartStateModel) {
    return state.is_digital_only;
  }

  @Selector()
  static stickyCart(state: CartStateModel) {
    return state.stickyCartOpen;
  }

  @Selector()
  static sidebarCartOpen(state: CartStateModel) {
    return state.sidebarCartOpen;
  }

  @Action(GetCartItems)
  getCartItems(ctx: StateContext<CartStateModel>) {
    const stored = localStorage.getItem('cart');
    if (stored) {
      ctx.patchState(JSON.parse(stored));
    }
  }

  @Action(AddToCart)
  add(ctx: StateContext<CartStateModel>, action: AddToCart) {
    if (action.payload.id) {
      return this.store.dispatch(new UpdateCart(action.payload));
    }
    return this.store.dispatch(new AddToCartLocalStorage(action.payload));
  }

  @Action(AddToCartLocalStorage)
  addToLocalStorage(ctx: StateContext<CartStateModel>, action: AddToCartLocalStorage) {
    let salePrice = action.payload.variation
      ? action.payload.variation.sale_price
      : action.payload.product?.sale_price;

    let result: CartModel = {
      is_digital_only: false,
      items: [{
        id: Number(Math.floor(Math.random() * 10000).toString().padStart(4, '0')),
        quantity: action.payload.quantity,
        sub_total: salePrice ? salePrice * action.payload.quantity : 0,
        product: action.payload.product!,
        product_id: action.payload.product_id,
        wholesale_price: null,
        variation: action.payload.variation!,
        variation_id: action.payload.variation_id
      }]
    };

    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => item.id === result.items[0].id);
    let output = { ...state };

    if (index == -1) {
      if (!state.items.length) {
        output.items = [...state.items, ...result.items];
      } else {
        if (result.items[0].variation) {
          if (state.items.find(item => item.variation_id == result.items[0].variation_id)) {
            cart.find(item => {
              if (item.variation_id == result.items[0].variation_id) {
                const stock = item.variation?.quantity;
                if (stock < item.quantity + action.payload.quantity) {
                  this.notificationService.showError(`Stock insuficiente. Disponible: ${stock}`);
                  return false;
                }
                item.quantity += result.items[0].quantity;
                item.sub_total = item.quantity * (item.variation.sale_price);
              }
            });
          } else {
            output.items = [...state.items, ...result.items];
          }
        } else if (state.items.find(item => item.product_id == result.items[0].product_id)) {
          cart.find(item => {
            if (item.product_id == result.items[0].product_id) {
              const stock = item.product?.quantity;
              if (stock < item.quantity + action.payload.quantity) {
                this.notificationService.showError(`Stock insuficiente. Disponible: ${stock}`);
                return false;
              }
              item.quantity += result.items[0].quantity;
              item.sub_total = item.quantity * (item.product.sale_price);
            }
          });
        } else {
          output.items = [...state.items, ...result.items];
        }
      }
    }

    output.items.forEach(item => {
      if (item?.variation) {
        item.variation.selected_variation = item.variation.attribute_values?.map(val => val.value).join('/');
      }
    });

    output.total = output.items.reduce((acc, curr) => acc + Number(curr.sub_total), 0);
    output.stickyCartOpen = true;
    output.sidebarCartOpen = true;
    output.is_digital_only = output.items.every(item => item.product?.product_type === 'digital');

    ctx.patchState(output);
    this.saveCartToStorage(output);

    setTimeout(() => {
      this.store.dispatch(new CloseStickyCart());
    }, 1500);
  }

  @Action(UpdateCart)
  update(ctx: StateContext<CartStateModel>, action: UpdateCart) {
    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => Number(item.id) === Number(action.payload.id));

    const stock = cart[index]?.variation?.quantity || cart[index]?.product?.quantity;
    if (stock < cart[index].quantity + action.payload.quantity) {
      this.notificationService.showError(`Stock insuficiente. Disponible: ${stock}`);
      return;
    }

    cart[index].quantity += action.payload.quantity;
    cart[index].sub_total = cart[index].quantity *
      (cart[index].variation ? cart[index].variation.sale_price : cart[index].product.sale_price);

    const total = cart.reduce((acc, curr) => acc + Number(curr.sub_total), 0);

    const updatedState: CartStateModel = {
      ...state,
      items: cart,
      total,
      is_digital_only: cart.every(item => item.product?.product_type === 'digital')
    };

    ctx.patchState(updatedState);
    this.saveCartToStorage(updatedState);
  }

  @Action(ReplaceCart)
  replace(ctx: StateContext<CartStateModel>, action: ReplaceCart) {
    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => Number(item.id) === Number(action.payload.id));

    cart[index].variation = action.payload.variation!;
    cart[index].variation_id = action.payload.variation_id;
    cart[index].quantity = action.payload.quantity;
    cart[index].variation.selected_variation = cart[index].variation.attribute_values?.map(val => val.value).join('/');
    cart[index].sub_total = cart[index].quantity * cart[index].variation.sale_price;

    const total = cart.reduce((acc, curr) => acc + Number(curr.sub_total), 0);

    const updatedState = { ...state, items: cart, total };
    ctx.patchState(updatedState);
    this.saveCartToStorage(updatedState);
  }

  @Action(DeleteCart)
  delete(ctx: StateContext<CartStateModel>, { id }: DeleteCart) {
    const state = ctx.getState();
    const updatedItems = state.items.filter(item => item.id !== id);
    const total = updatedItems.reduce((acc, curr) => acc + Number(curr.sub_total), 0);

    const updatedState = {
      ...state,
      items: updatedItems,
      total,
      is_digital_only: updatedItems.every(item => item.product?.product_type === 'digital')
    };

    ctx.patchState(updatedState);
    this.saveCartToStorage(updatedState);
  }

  @Action(ClearCart)
  clearCart(ctx: StateContext<CartStateModel>) {
    const cleared = {
      items: [],
      total: 0,
      is_digital_only: null,
      stickyCartOpen: false,
      sidebarCartOpen: false
    };
    ctx.patchState(cleared);
    this.removeCartFromStorage();
  }

  @Action(CloseStickyCart)
  closeStickyCart(ctx: StateContext<CartStateModel>) {
    const state = ctx.getState();
    ctx.patchState({ ...state, stickyCartOpen: false });
  }

  @Action(ToggleSidebarCart)
  toggleSidebarCart(ctx: StateContext<CartStateModel>, { value }: ToggleSidebarCart) {
    const state = ctx.getState();
    ctx.patchState({ ...state, sidebarCartOpen: value });
  }

  @Action(SyncCart)
  syncCart(ctx: StateContext<CartStateModel>, action: SyncCart) {
    // Logic for syncing with backend (opcional)
  }
}
