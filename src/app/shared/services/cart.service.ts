import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { CartModel } from '../interface/cart.interface';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private subjectQty = new Subject<boolean>();
  private platformId = inject(PLATFORM_ID);

  constructor() {}



  getCartItems(): Observable<CartModel> {
    if (isPlatformBrowser(this.platformId)) {
      const data = localStorage.getItem('cart');
      if (data) {
        return of(JSON.parse(data) as CartModel);
      }
    }

    return of({

      items: [],
      total: 0,
      is_digital_only: false,
      stickyCartOpen: false,
      sidebarCartOpen: false
    });
  }


  updateQty() {
    this.subjectQty.next(true);
  }

  /**
   * Devuelve el observable que escucha los cambios de cantidad
   */
  getUpdateQtyClickEvent(): Observable<boolean> {
    return this.subjectQty.asObservable();
  }

}
