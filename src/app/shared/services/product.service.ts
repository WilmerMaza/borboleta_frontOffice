import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '../interface/core.interface';
import { Observable, timeout, catchError, of } from 'rxjs';
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
    console.log('=== PRODUCT SERVICE ===');
    console.log('Payload enviado:', payload);
    console.log('URL:', `${environment.URLS}/products`);
    
    return this.http.get<ProductModel>(`${environment.URLS}/products`, { params: payload }).pipe(
      timeout(10000), // 10 segundos timeout
      catchError(error => {
        console.log('Error en getProducts:', error);
        return of({ data: [], total: 0, page: 1, limit: 10 } as ProductModel);
      })
    );
  }

  getProductById(id: string | number): Observable<Product> {
    return this.http.get<Product>(`${environment.URLS}/products/${id}`).pipe(
      timeout(8000), // 8 segundos timeout
      catchError(error => {
        return of({} as Product);
      })
    );
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${environment.URLS}/products/slug/${slug}`).pipe(
      timeout(8000), // 8 segundos timeout
      catchError(error => {
        return of({} as Product);
      })
    );
  }

  getProductBySearchList(payload?: Params): Observable<any> {
    return this.http.get<any>(`${environment.URLS}/products`, { params: payload }).pipe(
      timeout(10000), // 10 segundos timeout
      catchError(error => {
        return of({ data: [], total: 0, page: 1, limit: 10 });
      })
    );
  }

 
}
