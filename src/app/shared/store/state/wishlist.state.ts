import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext, Store } from "@ngxs/store";
import { of } from "rxjs";

import { Product } from "../../interface/product.interface";

import { NotificationService } from "../../services/notification.service";
import { WishlistService } from "../../services/wishlist.service";

import { GetWishlist, AddToWishlist, DeleteWishlist } from "../action/wishlist.action";

export class WishlistStateModel {
  wishlist = {
    data: [] as Product[],
    total: 0
  };
  wishlistIds: number[] = [];
}

const WISHLIST_STORAGE_KEY = "wishlist";

@State<WishlistStateModel>({
  name: "wishlist",
  defaults: {
    wishlist: {
      data: [],
      total: 0
    },
    wishlistIds: []
  },
})
@Injectable()
export class WishlistState {

  constructor(
    private store: Store,
    private wishlistService: WishlistService,
    private notificationService: NotificationService
  ) {}

  ngxsOnInit(ctx: StateContext<WishlistStateModel>) {
    this.loadFromLocalStorage(ctx);
  }

  @Selector()
  static wishlistItems(state: WishlistStateModel) {
    return state.wishlist;
  }

  @Selector()
  static wishlistIds(state: WishlistStateModel) {
    return state.wishlistIds;
  }

  private loadFromLocalStorage(ctx: StateContext<WishlistStateModel>) {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) return;
      const data: Product[] = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      const ids = data.map((p) => p.id);
      ctx.patchState({
        wishlist: { data, total: data.length },
        wishlistIds: ids
      });
    } catch {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  }

  private saveToLocalStorage(data: Product[]) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(data));
    } catch {
      localStorage.removeItem(WISHLIST_STORAGE_KEY);
    }
  }

  @Action(GetWishlist)
  getWishlistItems(ctx: StateContext<WishlistStateModel>) {
    this.wishlistService.skeletonLoader = true;
    this.loadFromLocalStorage(ctx);
    this.wishlistService.skeletonLoader = false;
  }

  @Action(AddToWishlist)
  add(ctx: StateContext<WishlistStateModel>, action: AddToWishlist) {
    const product = action.payload?.product;
    if (!product) return of(undefined);

    const state = ctx.getState();
    const exists = state.wishlistIds.includes(product.id);

    if (exists) {
      const newData = state.wishlist.data.filter((p) => p.id !== product.id);
      const newIds = newData.map((p) => p.id);
      ctx.patchState({
        wishlist: { data: newData, total: newData.length },
        wishlistIds: newIds
      });
      this.saveToLocalStorage(newData);
      this.notificationService.showSuccess("Producto eliminado de tu lista de deseos");
      return of(undefined);
    }

    const newData = [...state.wishlist.data, product];
    const newIds = newData.map((p) => p.id);
    ctx.patchState({
      wishlist: { data: newData, total: newData.length },
      wishlistIds: newIds
    });
    this.saveToLocalStorage(newData);
    this.notificationService.showSuccess("Producto agregado a tu lista de deseos");
    return of(undefined);
  }

  @Action(DeleteWishlist)
  delete(ctx: StateContext<WishlistStateModel>, { id }: DeleteWishlist) {
    const state = ctx.getState();
    const newData = state.wishlist.data.filter((p) => p.id !== id);
    const newIds = newData.map((p) => p.id);
    ctx.patchState({
      wishlist: { data: newData, total: newData.length },
      wishlistIds: newIds
    });
    this.saveToLocalStorage(newData);
    return of(undefined);
  }
}
