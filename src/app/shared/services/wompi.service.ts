import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WompiWidgetDataResponse {
  success: boolean;
  data?: {
    publicKey: string;
    currency: string;
    amountInCents: number;
    reference: string;
    signatureIntegrity: string;
    redirectUrl: string;
    expirationTime?: string;
    taxes?: { vat: number; consumption: number };
    customerData?: any;
    shippingAddress?: any;
    pendingOrder?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class WompiService {
  private baseUrl = `${environment.URLS}/wompi`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los datos del widget de Wompi (incluyendo signature)
   */
  getWidgetData(body: any): Observable<WompiWidgetDataResponse> {
    return this.http.post<WompiWidgetDataResponse>(`${this.baseUrl}/widget-data`, body);
  }

  /**
   * Verifica el estado del pago por referencia
   */
  verifyByReference(reference: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/verify/${reference}`);
  }

  /**
   * Confirma el pago y crea la orden inmediatamente
   * Este endpoint busca la orden pendiente, crea la orden, elimina la pendiente y devuelve la orden creada
   * @param reference - La referencia de la transacción de Wompi
   * @param transactionId - El ID de la transacción (opcional)
   * @param status - El status del pago (APPROVED, DECLINED, etc.). Por defecto 'APPROVED'
   */
  confirmPayment(reference: string, transactionId?: string, status: string = 'APPROVED'): Observable<any> {
    const body: any = { reference };
    if (transactionId) {
      body.transaction_id = transactionId;
    }
    // El backend requiere status=APPROVED para crear la orden
    body.status = status;
    return this.http.post<any>(`${this.baseUrl}/confirm-payment`, body);
  }
}

