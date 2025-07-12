import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CartAddOrUpdate, CartModel } from '../interface/cart.interface';
import { environment } from '../../../environments/environment.development';

// Interfaces para los payloads
interface CartItemPayload {
  user_id: number;
  product_id: number;
  quantity: number;
  variation_id?: number;
}

interface UpdateCartItemPayload {
  user_id: number;
  quantity: number;
}

interface RemoveCartItemPayload {
  user_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private subjectQty = new Subject<boolean>();

  constructor(private http: HttpClient) {}

  getCartItems(): Observable<CartModel> {
    return this.http.get<CartModel>(`${environment.URLS}/cart`);
  }

  updateQty() {
    this.subjectQty.next(true);
  }

  getUpdateQtyClickEvent(): Observable<boolean>{
    return this.subjectQty.asObservable();
  }

  // ===== ENDPOINTS DEL CARRITO =====

  /**
   * GET /api/cart?user_id=23 - Obtener carrito
   */
  getCart(user_id: number): Observable<CartModel> {
    console.log('🔄 CartService.getCart - user_id:', user_id);
    return this.http.get<CartModel>(`${environment.URLS}/api/cart?user_id=${user_id}`);
  }

  /**
   * POST /api/cart - Agregar producto
   */
  addToCart(user_id: number, product_id: number, quantity: number, variation_id?: number): Observable<any> {
    console.log('🔄 CartService.addToCart - user_id:', user_id, 'product_id:', product_id);
    const payload: CartItemPayload = {
      user_id,
      product_id,
      quantity,
      variation_id
    };
    return this.http.post(`${environment.URLS}/api/cart`, payload);
  }

  /**
   * PUT /api/cart/{id} - Actualizar item
   */
  updateCartItem(user_id: number, id: string, quantity: number): Observable<any> {
    console.log('🔄 CartService.updateCartItem - user_id:', user_id, 'id:', id, 'quantity:', quantity);
    const payload: UpdateCartItemPayload = {
      user_id,
      quantity
    };
    return this.http.put(`${environment.URLS}/api/cart/${id}`, payload);
  }

  /**
   * DELETE /api/cart/{id} - Eliminar item
   */
  removeFromCart(user_id: number, id: string): Observable<any> {
    console.log('🔄 CartService.removeFromCart - user_id:', user_id, 'id:', id);
    const payload: RemoveCartItemPayload = {
      user_id
    };
    return this.http.delete(`${environment.URLS}/api/cart/${id}`, { body: payload });
  }

  /**
   * DELETE /api/cart - Vaciar carrito
   */
  clear(user_id: number): Observable<any> {
    console.log('🔄 CartService.clear - user_id:', user_id);
    const payload: RemoveCartItemPayload = {
      user_id
    };
    return this.http.delete(`${environment.URLS}/api/cart`, { body: payload });
  }

}
