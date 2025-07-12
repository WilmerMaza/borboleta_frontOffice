import { CartAddOrUpdate } from "../../interface/cart.interface";

export class GetCartItems {
  static readonly type = "[Cart] Get";
}

export class AddToCartLocalStorage {
  static readonly type = "[Cart] Local Storage Add";
  constructor(public payload: CartAddOrUpdate) {}
}

export class AddToCart {
  static readonly type = "[Cart] Add";
  constructor(public payload: CartAddOrUpdate) {}
}

export class UpdateCart {
  static readonly type = "[Cart] Update";
  constructor(public payload: CartAddOrUpdate) {}
}

export class ReplaceCart {
  static readonly type = "[Cart] Replace";
  constructor(public payload: CartAddOrUpdate) {}
}

export class SyncCart {
  static readonly type = "[Cart] Sync";
  constructor(public payload: CartAddOrUpdate[]) {}
}

export class DeleteCart {
  static readonly type = "[Cart] Delete";
  constructor(public id: number) {}
}

export class CloseStickyCart {
  static readonly type = "[Cart] Sticky Close";
  constructor() {}
}

export class ToggleSidebarCart {
  static readonly type = "[Cart] Toggle Sidebar";
  constructor(public value: boolean) {}
}

export class ClearCart {
  static readonly type = "[Cart] Clear";
  constructor() {}
}

// ===== ACCIONES DEL SERVIDOR =====

export class GetCartFromServer {
  static readonly type = "[Cart] Get From Server";
  constructor(public payload: { user_id: number }) {}
}

export class AddToCartServer {
  static readonly type = "[Cart] Add To Server";
  constructor(public payload: { 
    user_id: number; 
    product_id: number; 
    quantity: number; 
    variation_id?: number 
  }) {}
}

export class UpdateCartItemServer {
  static readonly type = "[Cart] Update Item Server";
  constructor(public payload: { 
    user_id: number; 
    id: string; 
    quantity: number 
  }) {}
}

export class RemoveFromCartServer {
  static readonly type = "[Cart] Remove From Server";
  constructor(public payload: { 
    user_id: number; 
    id: string 
  }) {}
}

export class ClearCartServer {
  static readonly type = "[Cart] Clear Server";
  constructor(public payload: { user_id: number }) {}
}
