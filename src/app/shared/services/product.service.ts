import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '../interface/core.interface';
import { Observable } from 'rxjs';
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

  /** API de productos: GET {URLS}/products. Sin filtros (category, brand, etc.) devuelve todos los productos. */
  getProducts(payload?: Params): Observable<ProductModel> {
    const params = payload ? this.cleanEmptyParams(payload) : {};
    return this.http.get<ProductModel>(`${environment.URLS}/products`, {
      params,
    });
  }

  /** API de todos los productos: GET {URLS}/products con paginación. Usar en colección sin filtros. */
  getAllProducts(page: number = 1, paginate: number = 12, sortBy: string = 'asc'): Observable<ProductModel> {
    const params: Params = {
      page,
      paginate,
      status: 1,
      field: 'created_at',
      sortBy,
    };
    return this.http.get<ProductModel>(`${environment.URLS}/products`, {
      params,
    });
  }

  /** Excluye null, undefined y string vacío para no enviar filtros vacíos al API */
  private cleanEmptyParams(payload: Params): Params {
    return Object.fromEntries(
      Object.entries(payload).filter(
        ([_, v]) => v != null && v !== ''
      )
    ) as Params;
  }

  getProductBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`${environment.URLS}/products/slug/${slug}`);
  }

  getProductBySearchList(payload?: Params): Observable<any> {
    return this.http.get<any>(`${environment.URLS}/products`, {
      params: payload,
    });
  }

 
}
