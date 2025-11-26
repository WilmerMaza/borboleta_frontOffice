import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { CheckoutPayload, Order, OrderCheckout, OrderModel, PlaceOrder, RePaymentPayload } from '../interface/order.interface';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  public skeletonLoader: boolean = false;

  constructor(private http: HttpClient) {}

  getOrders(payload: any): Observable<OrderModel> {
    // El user_id ahora viene en el payload desde el OrderState
    const params = {
      ...payload
    };
    
    // Si no hay user_id en el payload, intentar obtenerlo del localStorage como fallback
    if (!params.user_id && typeof window !== 'undefined') {
      try {
        const account = JSON.parse(localStorage.getItem('account') || '{}');
        const userId = account.user?.id;
        if (userId) {
          params.user_id = userId;
        }
      } catch (error) {
        // Ignorar errores al obtener user_id del localStorage
      }
    }
    
    return this.http.get<OrderModel>(`${environment.URLS}/orders`, { 
      params: params,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  viewOrder(id: string): Observable<OrderModel> {
    return this.http.get<OrderModel>(`${environment.URLS}/orders/${id}`);
  }

  orderTracking(payload: { order_number: string, email_or_phone: string }): Observable<Order> {
    return this.http.get<Order>(`${environment.URL}/trackOrder`, { params: payload });
  }

  createOrder(payload: CheckoutPayload): Observable<any> {
    return this.http.post<any>(`${environment.URLS}/orders`, payload);
  }

}
