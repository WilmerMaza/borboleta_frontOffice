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
import { Variation } from "../../interface/product.interface";

export interface CartStateModel {
  items: Cart[];
  total: number;
  is_digital_only: boolean;
  stickyCartOpen: boolean;
  sidebarCartOpen: boolean;
}

@State<CartStateModel>({
  name: "cart",
  defaults: {
    items: [],
    total: 0,
    is_digital_only: false,
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
    // Cargar el carrito desde localStorage al inicializar
    this.loadFromLocalStorage(ctx);
    ctx.dispatch(new ToggleSidebarCart(false));
    ctx.dispatch(new CloseStickyCart());
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
    // Siempre cargar desde localStorage, sin importar el estado de autenticación
    this.loadFromLocalStorage(ctx);
  }

  // Método helper para cargar desde localStorage
  private loadFromLocalStorage(ctx: StateContext<CartStateModel>) {
    if (typeof window !== 'undefined') {
      try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
          const cart = JSON.parse(cartData);
          ctx.patchState({
            items: cart.items || [],
            total: cart.total || 0,
            is_digital_only: cart.is_digital_only || false
          });
        }
      } catch (error) {
        localStorage.removeItem('cart');
      }
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

    let salePrice = action.payload.variation ?  action.payload.variation.sale_price : action.payload.product?.sale_price;
    let result: CartModel = {
      is_digital_only: false,
      items: [{
        id: Number(Math.floor(Math.random() * 10000).toString().padStart(4, '0')), // Generate Random Id
        quantity: action.payload.quantity,
        sub_total: salePrice ? salePrice * action.payload.quantity : 0,
        product: action.payload.product!,
        product_id: action.payload.product_id,
        wholesale_price: null,
        variation: action.payload.variation!,
        variation_id: action.payload.variation_id
      }]
    }

    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => item.id === result.items[0].id);

    let output = { ...state };

    if (index == -1) {
      if(!state.items.length){
        output.items = [...state.items, ...result.items]
      }else {
        if(result.items[0].variation){
          if(state.items.find(item => item.variation_id == result.items[0].variation_id)){

            cart.find((item) => {
              if(item.variation_id){
                if(item.variation_id == result.items[0].variation_id){

                const productQty = item?.variation?.quantity;

                if (productQty < item?.quantity + action?.payload.quantity) {
                  this.notificationService.showError(`You can not add more items than available. In stock ${productQty} items.`);
                  return false;
                }

                item.quantity = item?.quantity + result.items[0].quantity;
                item.sub_total = item?.quantity * (item?.variation?.sale_price);
                }
              }
            })
          }else{
            output.items = [...state.items, ...result.items]
          }
        }
        else if(state.items.find(item => item.product_id == result.items[0].product_id)){
          cart.find((item) => {
            if(item.product_id == result.items[0].product_id){
              const productQty = item?.product?.quantity;

              if (productQty < item?.quantity + action?.payload.quantity) {
                this.notificationService.showError(`You can not add more items than available. In stock ${productQty} items.`);
                return false;
              }

              item.quantity = item?.quantity + result.items[0].quantity;
              item.sub_total = item?.quantity * (item.product.sale_price);
            }
          })
        }else{
          output.items = [...state.items, ...result.items]
        }
      }
    }

    // Set Selected Variant
    output.items.filter(item => {
      if(item?.variation) {
        item.variation.selected_variation = item?.variation?.attribute_values?.map(values => values.value)?.join('/');
      }
    });

    // Calculate Total
    output.total = output.items.reduce((prev, curr: Cart) => {
      return (prev + Number(curr.sub_total));
    }, 0);

    output.stickyCartOpen = true;
    output.sidebarCartOpen = true;
    output.is_digital_only = output.items.map(item => item.product && item?.product?.product_type).every(item => item == 'digital');

    ctx.patchState(output);

    // Sincronizar con localStorage manualmente
    this.syncToLocalStorage(output.items, output.total, output.is_digital_only);

    setTimeout(() => {
      this.store.dispatch(new CloseStickyCart());
    }, 1500);
  }

  @Action(UpdateCart)
  update(ctx: StateContext<CartStateModel>, action: UpdateCart) {
    return this.updateLocalStorage(ctx, action);
  }

  // Método helper para actualizar localStorage
  private updateLocalStorage(ctx: StateContext<CartStateModel>, action: UpdateCart) {
    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => item.id === action.payload.id);
    
    if (index !== -1) {
      // Si la cantidad es 0 o negativa, eliminar el producto
      if (action.payload.quantity <= 0) {
        this.deleteFromLocalStorage(ctx, action.payload.id!);
        return;
      }
      
      // Usar el precio correcto del producto que ya está en el carrito
      const price = cart[index]?.variation ? cart[index]?.variation?.sale_price : 
                   (cart[index]?.wholesale_price || cart[index]?.product?.sale_price || 0);
      
      cart[index] = {
        ...cart[index],
        quantity: action.payload.quantity,
        sub_total: price * action.payload.quantity
      };
    }
    const total = cart.reduce((prev, curr) => prev + Number(curr.sub_total), 0);
    ctx.patchState({
      items: cart,
      total: total
    });

    // Sincronizar con localStorage manualmente
    this.syncToLocalStorage(cart, total, cart.map(item => item.product && item?.product?.product_type).every(item => item == 'digital'));
  }

  @Action(ReplaceCart)
  replace(ctx: StateContext<CartStateModel>, action: ReplaceCart) {

    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => Number(item.id) === Number(action.payload.id));

    // Update Cart If cart id same but variant id is different
    if(cart[index]?.variation && action.payload.variation_id &&
      Number(cart[index].id) === Number(action.payload.id) &&
      Number(cart[index]?.variation_id) != Number(action.payload.variation_id)) {
      cart[index].variation = action.payload.variation!;
      cart[index].variation_id = action.payload.variation_id;
      cart[index].variation.selected_variation = cart[index]?.variation?.attribute_values?.map(values => values.value)?.join('/')
    }

    const productQty = cart[index]?.variation ? cart[index]?.variation?.quantity : cart[index]?.product?.quantity;
    const newQuantity = cart[index]?.quantity + action?.payload.quantity;

    if (newQuantity > 0 && productQty < newQuantity) {
      this.notificationService.showError(`You can not add more items than available. In stock ${productQty} items.`);
      return false;
    }

    cart[index].quantity = newQuantity;
    cart[index].sub_total = cart[index]?.quantity * (cart[index]?.variation ? cart[index]?.variation?.sale_price : cart[index].product.sale_price);

    if(cart[index].product?.wholesales?.length) {
      let wholesale = cart[index].product.wholesales.find(value => value.min_qty <= cart[index].quantity && value.max_qty >= cart[index].quantity) || null;
      if(wholesale && cart[index].product.wholesale_price_type == 'fixed') {
        cart[index].sub_total = cart[index].quantity * wholesale.value;
        cart[index].wholesale_price = cart[index].sub_total / cart[index].quantity;
      } else if(wholesale && cart[index].product.wholesale_price_type == 'percentage') {
        cart[index].sub_total = cart[index].quantity * (cart[index]?.variation ? cart[index]?.variation?.sale_price : cart[index].product.sale_price);
        cart[index].sub_total = cart[index].sub_total - (cart[index].sub_total * (wholesale.value / 100));
        cart[index].wholesale_price = cart[index].sub_total / cart[index].quantity;
      } else {
        cart[index].sub_total = cart[index]?.quantity * (cart[index]?.variation ? cart[index]?.variation?.sale_price : cart[index].product.sale_price);
        cart[index].wholesale_price = null;
      }
    } else {
      cart[index].sub_total = cart[index]?.quantity * (cart[index]?.variation ? cart[index]?.variation?.sale_price : cart[index].product.sale_price);
      cart[index].wholesale_price = null;
    }

    if (cart[index].quantity < 1) {
      this.store.dispatch(new DeleteCart(action.payload.id!));
      return of();
    }

    let total = cart.reduce((prev, curr: Cart) => {
      return (prev + Number(curr.sub_total));
    }, 0);

    ctx.patchState({
      items: cart,
      is_digital_only: cart.map(item => item.product && item?.product?.product_type).every(item => item == 'digital'),
      total: total,
      stickyCartOpen: false,
      sidebarCartOpen: false
    });

    // Sincronizar con localStorage manualmente
    this.syncToLocalStorage(cart, total, cart.map(item => item.product && item?.product?.product_type).every(item => item == 'digital'));
  }

  @Action(DeleteCart)
  delete(ctx: StateContext<CartStateModel>, { id }: DeleteCart) {
    return this.deleteFromLocalStorage(ctx, id);
  }

  // Método helper para eliminar de localStorage
  private deleteFromLocalStorage(ctx: StateContext<CartStateModel>, id: number) {
    const state = ctx.getState();
    const cart = state.items.filter(item => item.id !== id);
    const total = cart.reduce((prev, curr) => prev + Number(curr.sub_total), 0);
    ctx.patchState({
      items: cart,
      total: total
    });

    // Sincronizar con localStorage manualmente
    this.syncToLocalStorage(cart, total, cart.map(item => item.product && item?.product?.product_type).every(item => item == 'digital'));
  }

  @Action(SyncCart)
  syncCart(ctx: StateContext<CartStateModel>, action: SyncCart) {
    
    // Procesar cada item del carrito para sincronizar
    const syncedItems: Cart[] = action.payload.map(item => {
      // Crear un objeto Cart válido
      const cartItem: Cart = {
        id: Number(Math.floor(Math.random() * 10000).toString().padStart(4, '0')),
        quantity: item.quantity,
        sub_total: item.variation ? item.variation.sale_price * item.quantity : (item.product?.sale_price || 0) * item.quantity,
        product: item.product!,
        product_id: item.product_id,
        wholesale_price: null,
        variation: item.variation || {} as Variation, // Usar un objeto vacío como fallback
        variation_id: item.variation_id || null
      };
      return cartItem;
    });

    // Calcular total
    const total = syncedItems.reduce((prev, curr: Cart) => {
      return (prev + Number(curr.sub_total));
    }, 0);

    const isDigitalOnly = syncedItems.map(item => item.product && item?.product?.product_type).every(item => item == 'digital');

    // Actualizar estado
    ctx.patchState({
      items: syncedItems,
      total: total,
      is_digital_only: isDigitalOnly,
      stickyCartOpen: false,
      sidebarCartOpen: false
    });

    // Sincronizar con localStorage manualmente
    this.syncToLocalStorage(syncedItems, total, isDigitalOnly);
  }

  @Action(CloseStickyCart)
  closeStickyCart(ctx: StateContext<CartStateModel>) {
    const state = ctx.getState();
    ctx.patchState({
      ...state,
      stickyCartOpen: false,
    });
  }

  @Action(ToggleSidebarCart)
  toggleSidebarCart(ctx: StateContext<CartStateModel>, { value }: ToggleSidebarCart) {
    const state = ctx.getState();
    ctx.patchState({
      ...state,
      sidebarCartOpen: value,
    });
  }

  @Action(ClearCart)
  clearCart(ctx: StateContext<CartStateModel>) {
    return this.clearLocalStorage(ctx);
  }

  // Método helper para limpiar localStorage
  private clearLocalStorage(ctx: StateContext<CartStateModel>) {
    const newState = {
      items: [],
      total: 0
    };
    ctx.patchState(newState);
    // Sincronizar con localStorage manualmente
    this.syncToLocalStorage([], 0, false);
  }

  // Función helper para sincronizar con localStorage
  private syncToLocalStorage(items: Cart[], total: number, isDigitalOnly: boolean) {
    if (typeof window !== 'undefined') {
      const cartData = {
        items: items,
        total: total,
        is_digital_only: isDigitalOnly
      };
      localStorage.setItem('cart', JSON.stringify(cartData));
    }
  }
}