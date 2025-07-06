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

  constructor(private cartService: CartService,
    private notificationService: NotificationService,
    private store: Store) {
  }

  ngxsOnInit(ctx: StateContext<CartStateModel>) {
    ctx.dispatch(new ToggleSidebarCart(false));
    ctx.dispatch(new CloseStickyCart());
    // Cargar el carrito automáticamente al inicializar
    ctx.dispatch(new GetCartItems());
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
  static cartItemsCount(state: CartStateModel) {
    return state.items.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0);
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
    // Usar un userId genérico o sessionId
    const sessionId = 'anonymous'; // O generar un sessionId único
    return this.cartService.getCart(sessionId).pipe(
      tap({
        next: (result: any) => {
          console.log('🛒 === DATOS COMPLETOS DEL BACKEND ===');
          console.log('Resultado completo:', JSON.stringify(result, null, 2));
          
          // El backend envía los datos en result.data
          const cartData = result?.data || result;
          console.log('📦 Datos del carrito procesados:', cartData);
          
          // Set Selected Variant
          if (cartData && cartData.items) {
            console.log(`📊 Número total de items recibidos: ${cartData.items.length}`);
            console.log(`🎯 PRODUCTOS ENCONTRADOS:`);
            cartData.items.forEach((item: Cart, index: number) => {
              console.log(`  ${index + 1}. ${item.product?.name || 'Sin nombre'} (ID: ${item.product?.id}, Product_ID: ${item.product_id})`);
            });
            
            // Log detallado de cada item
            cartData.items.forEach((item: Cart, index: number) => {
              console.log(`\n🔍 ITEM ${index + 1}:`);
              console.log('  ID del item:', item.id);
              console.log('  Product ID:', item.product_id);
              console.log('  Tipo de product_id:', typeof item.product_id);
              console.log('  Product object:', item.product);
              console.log('  Product name:', item.product?.name);
              console.log('  Product _id:', item.product?._id);
              console.log('  Product numeric_id:', item.product?.numeric_id);
              console.log('  Quantity:', item.quantity);
              console.log('  Sub total:', item.sub_total);
              console.log('  Variation:', item.variation);
              console.log('  Variation ID:', item.variation_id);
            });
            
            // MOSTRAR TODOS LOS PRODUCTOS TEMPORALMENTE
            const itemsAntes = cartData.items.length;
            console.log(`\n📊 PROCESANDO ${itemsAntes} PRODUCTOS:`);
            
            cartData.items.forEach((item: Cart, index: number) => {
              console.log(`\n🔍 PRODUCTO ${index + 1}:`);
              console.log('  - Nombre:', item.product?.name);
              console.log('  - Item ID:', item.id);
              console.log('  - Product ID (original):', item.product_id);
              console.log('  - Product numeric_id:', item.product?.numeric_id);
              console.log('  - Product _id:', item.product?._id);
              
              // ASIGNAR PRODUCT_ID SI NO LO TIENE
              if (!item.product_id) {
                if (item.product?.numeric_id) {
                  item.product_id = item.product.numeric_id;
                  console.log(`  ✅ Asignando numeric_id como product_id: ${item.product.numeric_id}`);
                } else if (item.product?.id) {
                  item.product_id = item.product.id;
                  console.log(`  ✅ Asignando id como product_id: ${item.product.id}`);
                } else {
                  console.warn(`  ❌ No se pudo asignar product_id para: ${item.product?.name}`);
                }
              }
              
              console.log('  - Product ID (final):', item.product_id);
              console.log('  - Cantidad:', item.quantity);
              console.log('  - Sub Total:', item.sub_total);
            });
            
            console.log(`\n📈 RESUMEN:`);
            console.log(`  - Productos procesados: ${cartData.items.length}`);
            console.log(`  - Productos con product_id válido: ${cartData.items.filter((item: Cart) => !!item.product_id).length}`);
            
            console.log(`\n📈 Resumen del filtro:`);
            console.log(`  - Items antes del filtro: ${itemsAntes}`);
            console.log(`  - Items después del filtro: ${cartData.items.length}`);
            console.log(`  - Items eliminados: ${itemsAntes - cartData.items.length}`);
            
            // Procesar items válidos
            cartData.items.forEach((item: Cart, index: number) => {
              console.log(`\n💰 Procesando item válido ${index + 1}:`);
              console.log('  - Nombre:', item.product?.name);
              console.log('  - Precio unitario:', item.sub_total / item.quantity);
              console.log('  - Cantidad:', item.quantity);
              console.log('  - Sub total:', item.sub_total);
              
              if(item?.variation) {
                item.variation.selected_variation = item?.variation?.attribute_values?.map((values: any) => values.value)?.join('/');
                console.log('  - Variación seleccionada:', item.variation.selected_variation);
              }
            });
          } else {
            console.log('⚠️ No hay items en el carrito o cartData.items es undefined');
          }
          
          const finalState = cartData || { items: [], total: 0, is_digital_only: false };
          console.log('\n🎯 ESTADO FINAL DEL CARRITO:');
          console.log('  - Items válidos:', finalState.items.length);
          console.log('  - Total:', finalState.total);
          console.log('  - Es solo digital:', finalState.is_digital_only);
          console.log('=====================================\n');
          
          ctx.patchState(finalState);
        },
        error: (error) => {
          console.error('❌ Error al obtener carrito:', error);
          ctx.patchState({ items: [], total: 0, is_digital_only: false });
        }
      })
    );
  }

  @Action(AddToCart)
  add(ctx: StateContext<CartStateModel>, action: AddToCart) {
    console.log('🛒 === AGREGANDO AL CARRITO ===');
    console.log('Payload completo:', action.payload);
    console.log('Product ID enviado:', action.payload.product_id);
    console.log('Product object:', action.payload.product);
    console.log('Variation:', action.payload.variation);
    console.log('Quantity:', action.payload.quantity);
    
    // El backend ya envía product_id como number, no necesitamos conversión
    const payload = {
      product_id: action.payload.product_id,
      variation_id: action.payload.variation_id,
      quantity: action.payload.quantity
    };

    console.log('📤 Enviando al backend:', payload);

    const sessionId = 'anonymous';
    return this.cartService.addToCart(payload, sessionId).pipe(
      tap({
        next: (result: any) => {
          console.log('📥 Respuesta del backend después de agregar:', result);
          console.log('Estructura de la respuesta:', JSON.stringify(result, null, 2));
          
          // Recargar el carrito después de agregar
          console.log('🔄 Recargando carrito...');
          this.store.dispatch(new GetCartItems());
        },
        error: (error) => {
          console.error('❌ Error al agregar al carrito:', error);
        }
      })
    );
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

    setTimeout(() => {
      this.store.dispatch(new CloseStickyCart());
    }, 1500);
  }

  @Action(UpdateCart)
  update(ctx: StateContext<CartStateModel>, action: UpdateCart) {
    console.log('🔄 Ejecutando UpdateCart:', action.payload);
    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => Number(item.id) === Number(action.payload.id));

    if(cart[index]?.variation && action.payload.variation_id &&
      Number(cart[index].id) === Number(action.payload.id) &&
      Number(cart[index]?.variation_id) != Number(action.payload.variation_id)) {

        console.log('🔄 Reemplazando item en carrito');
        return this.store.dispatch(new ReplaceCart(action.payload));
    }

    const productQty = cart[index]?.variation ? cart[index]?.variation?.quantity : cart[index]?.product?.quantity;

    if (productQty < cart[index]?.quantity + action?.payload.quantity) {
      this.notificationService.showError(`You can not add more items than available. In stock ${productQty} items.`);
      return false;
    }

    if(cart[index]?.variation) {
      cart[index].variation.selected_variation = cart[index]?.variation?.attribute_values?.map(values => values.value)?.join('/');
    }
    cart[index].quantity = cart[index]?.quantity + action?.payload.quantity;
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
      console.log('🗑️ Eliminando item del carrito (cantidad < 1)');
      this.store.dispatch(new DeleteCart(action.payload.id!));
      return of();
    }

    let total = state.items.reduce((prev, curr: Cart) => {
      return (prev + Number(curr.sub_total));
    }, 0);

    ctx.patchState({
      ...state,
      items: cart,
      total: total
    });
  }

  @Action(ReplaceCart)
  replace(ctx: StateContext<CartStateModel>, action: ReplaceCart) {
    console.log('🔄 Ejecutando ReplaceCart:', action.payload);
    const state = ctx.getState();
    const cart = [...state.items];
    const index = cart.findIndex(item => Number(item.id) === Number(action.payload.id));

    if (index !== -1) {
      cart[index] = {
        ...cart[index],
        variation: action.payload.variation!,
        variation_id: action.payload.variation_id,
        quantity: action.payload.quantity,
        sub_total: action.payload.quantity * (action.payload.variation?.sale_price || cart[index].product.sale_price)
      };

      if(cart[index]?.variation) {
        cart[index].variation.selected_variation = cart[index]?.variation?.attribute_values?.map(values => values.value)?.join('/');
      }

      let total = cart.reduce((prev, curr: Cart) => {
        return (prev + Number(curr.sub_total));
      }, 0);

      ctx.patchState({
        ...state,
        items: cart,
        total: total
      });
    }
  }

  @Action(DeleteCart)
  delete(ctx: StateContext<CartStateModel>, { id }: DeleteCart) {
    console.log('🗑️ Ejecutando DeleteCart para id:', id);
    
    // Primero actualizar el estado local
    const state = ctx.getState();
    const cart = state.items.filter(item => Number(item.id) !== Number(id));
    let total = cart.reduce((prev, curr: Cart) => {
      return (prev + Number(curr.sub_total));
    }, 0);

    ctx.patchState({
      ...state,
      items: cart,
      total: total
    });

    // Luego llamar al endpoint del backend
    const sessionId = 'anonymous';
    return this.cartService.removeCartItem(id.toString(), sessionId).pipe(
      tap({
        next: (result: any) => {
          console.log('✅ Item eliminado exitosamente del backend:', result);
        },
        error: (error) => {
          console.error('❌ Error al eliminar item del backend:', error);
        }
      })
    );
  }

  @Action(SyncCart)
  syncCart(ctx: StateContext<CartStateModel>, action: SyncCart) {
    // SyncCart logic here
  }

  @Action(CloseStickyCart)
  closeStickyCart(ctx: StateContext<CartStateModel>) {
    console.log('❌ Cerrando sticky cart');
    ctx.patchState({
      stickyCartOpen: false
    });
  }

  @Action(ToggleSidebarCart)
  toggleSidebarCart(ctx: StateContext<CartStateModel>, { value }: ToggleSidebarCart) {
    console.log('🔄 Toggle sidebar cart:', value);
    ctx.patchState({
      sidebarCartOpen: value
    });
  }

  @Action(ClearCart)
  clearCart(ctx: StateContext<CartStateModel>) {
    console.log('🗑️ Ejecutando ClearCart');
    const sessionId = 'anonymous';
    return this.cartService.clearCart(sessionId).pipe(
      tap({
        next: (result: any) => {
          console.log('✅ Carrito vaciado exitosamente:', result);
          ctx.patchState({ items: [], total: 0, is_digital_only: false });
        },
        error: (error) => {
          console.error('❌ Error al vaciar carrito:', error);
        }
      })
    );
  }
}