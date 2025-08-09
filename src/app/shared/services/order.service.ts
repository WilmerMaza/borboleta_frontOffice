import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { CheckoutPayload, Order, OrderCheckout, OrderModel, PlaceOrder, RePaymentPayload } from '../interface/order.interface';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  public skeletonLoader: boolean = false;

  constructor(private http: HttpClient) {}

  getOrders(payload: any): Observable<OrderModel> {
    return this.http.get<OrderModel>(`${environment.URLS}/orders`, { params: payload });
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
