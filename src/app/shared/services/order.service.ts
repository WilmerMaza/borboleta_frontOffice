import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable } from 'rxjs';
import { CheckoutPayload, Order, OrderCheckout, OrderModel, PlaceOrder, RePaymentPayload } from '../interface/order.interface';
import { environment } from '../../../environments/environment.development';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  public skeletonLoader: boolean = false;

  constructor(private http: HttpClient) {}

  getOrders(payload?: Params): Observable<OrderModel> {
    return this.http.get<OrderModel>(`${environment.URL}/order.json`, { params: payload });
  }

  viewOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${environment.URL}/order/${id}`);
  }

  orderTracking(payload: { order_number: string, email_or_phone: string }): Observable<Order> {
    return this.http.get<Order>(`${environment.URL}/trackOrder`, { params: payload });
  }

  createOrder(orderData: any): Observable<any> {
    return this.http.post<any>(`${environment.URLS}/orders`, orderData).pipe(
      tap({
        next: (response) => {
          // Orden creada
        },
        error: (error) => {
          console.error('Error al crear la orden:', error);
        }
      })
    );
  }

  checkout(checkoutData: CheckoutPayload): Observable<OrderCheckout> {
    return this.http.post<OrderCheckout>(`${environment.URLS}/checkout`, checkoutData).pipe(
      tap({
        next: (response) => {
          console.log('Checkout response:', response);
        },
        error: (error) => {
          console.error('Error en checkout:', error);
        }
      })
    );
  }

}
