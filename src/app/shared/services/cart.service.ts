import { Injectable } from '@angular/core';
import { Observable, Subject, of } from 'rxjs';
import { CartModel } from '../interface/cart.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private subjectQty = new Subject<boolean>();

  constructor() {}

  getCartItems(): Observable<CartModel> {
    // Consultar localStorage en lugar del backend
    if (typeof window !== 'undefined') {
      try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
          const cart = JSON.parse(cartData);
          return of(cart);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    // Retornar carrito vacío si no hay datos
    return of({
      items: [],
      total: 0,
      is_digital_only: false
    });
  }

  updateQty() {
    this.subjectQty.next(true);
  }

  getUpdateQtyClickEvent(): Observable<boolean>{
    return this.subjectQty.asObservable();
  }

}
