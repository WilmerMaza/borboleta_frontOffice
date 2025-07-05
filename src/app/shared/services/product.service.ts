import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '../interface/core.interface';
import { Observable, tap } from 'rxjs';
import { Product, ProductModel } from '../interface/product.interface';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  public skeletonLoader: boolean = false;
  public skeletonCategoryProductLoader: boolean = false;
  public productFilter: boolean = false;
  public searchSkeleton: boolean = false;

  constructor(private http: HttpClient) {}

  getProducts(payload?: Params): Observable<ProductModel> {
    const url = `${environment.URLS}/products`;
    return this.http.get<ProductModel>(url, { params: payload }).pipe(
      tap({
        next: (response) => {
          // Respuesta recibida
        },
        error: (error) => {
          console.error('❌ Error en getProducts:', error);
        }
      })
    );
  }

  getProductBySlug(slug: string): Observable<Product> {
    const url = `${environment.URLS}/products/slug/${slug}`;
    return this.http.get<Product>(url).pipe(
      tap({
        next: (response) => {
          // Respuesta recibida
        },
        error: (error) => {
          console.error('❌ Error en getProductBySlug:', error);
        }
      })
    );
  }

  getProductBySearchList(payload?: Params): Observable<any> {
    const url = `${environment.URLS}/products`;
    return this.http.get<any>(url, { params: payload }).pipe(
      tap({
        next: (response) => {
          // Respuesta recibida
        },
        error: (error) => {
          console.error('❌ Error en getProductBySearchList:', error);
        }
      })
    );
  }

 
}
