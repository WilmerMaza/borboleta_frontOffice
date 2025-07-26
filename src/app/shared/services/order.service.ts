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

  getOrders(payload: any): Observable<OrderModel> {
    console.log('OrderService getOrders() - Making HTTP request to:', `${environment.URLS}/orders`);
    console.log('OrderService getOrders() - With payload:', payload);
    return this.http.get<OrderModel>(`${environment.URLS}/orders`, { params: payload }).pipe(
      tap({
        next: (result) => {
          console.log('OrderService getOrders() - Raw response from backend:', result);
          if (result.data && result.data.length > 0) {
            console.log('OrderService getOrders() - First order from backend:', result.data[0]);
            console.log('OrderService getOrders() - First order keys from backend:', Object.keys(result.data[0]));
          }
        },
        error: (err) => {
          console.error('OrderService getOrders() - Error from backend:', err);
        }
      })
    );
  }

  viewOrder(id: string): Observable<OrderModel> {
    console.log('OrderService viewOrder() - Making HTTP request to:', `${environment.URLS}/orders/${id}`);
    return this.http.get<OrderModel>(`${environment.URLS}/orders/${id}`).pipe(
      tap({
        next: (result) => {
          console.log('OrderService viewOrder() - Raw response from backend:', result);
        },
        error: (err) => {
          console.error('OrderService viewOrder() - Error from backend:', err);
        }
      })
    );
  }

  orderTracking(payload: { order_number: string, email_or_phone: string }): Observable<Order> {
    return this.http.get<Order>(`${environment.URL}/trackOrder`, { params: payload });
  }

  createOrder(payload: CheckoutPayload): Observable<any> {
    console.log('OrderService createOrder() - Sending payload to backend:', payload);
    console.log('OrderService createOrder() - Products in payload:', payload.products);
    return this.http.post<any>(`${environment.URLS}/orders`, payload).pipe(
      tap({
        next: (result) => {
          console.log('OrderService createOrder() - Backend response:', result);
        },
        error: (err) => {
          console.error('OrderService createOrder() - Backend error:', err);
        }
      })
    );
  }

}
