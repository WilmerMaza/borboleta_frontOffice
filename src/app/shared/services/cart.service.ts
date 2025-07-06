import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private updateQtyClickEvent = new Subject<void>();

  constructor(private http: HttpClient) {}

  // Obtener el carrito del usuario (user-id en headers)
  getCart(userId: string): Observable<any> {
    const headers = new HttpHeaders({ 'user-id': userId });
    return this.http.get<any>(`${environment.URLS}/cart`, { headers });
  }

  // Agregar producto al carrito
  addToCart(payload: { product_id: number, variation_id?: number | null, quantity: number }, userId: string): Observable<any> {
    const headers = new HttpHeaders({ 'user-id': userId });
    return this.http.post<any>(`${environment.URLS}/cart`, payload, { headers });
  }

  
  updateCartItem(cart_item_id: string, quantity: number, userId: string): Observable<any> {
    const headers = new HttpHeaders({ 'user-id': userId });
    return this.http.put<any>(`${environment.URLS}/cart/${cart_item_id}`, { quantity }, { headers });
  }

  // Eliminar producto del carrito
  removeCartItem(cart_item_id: string, userId: string): Observable<any> {
    const headers = new HttpHeaders({ 'user-id': userId });
    return this.http.delete<any>(`${environment.URLS}/cart/${cart_item_id}`, { headers });
  }

  // Vaciar el carrito
  clearCart(userId: string): Observable<any> {
    const headers = new HttpHeaders({ 'user-id': userId });
    return this.http.delete<any>(`${environment.URLS}/cart`, { headers });
  }

  // Métodos para compatibilidad con componentes existentes
  getUpdateQtyClickEvent(): Observable<void> {
    return this.updateQtyClickEvent.asObservable();
  }

  updateQty(): void {
    this.updateQtyClickEvent.next();
  }
}
