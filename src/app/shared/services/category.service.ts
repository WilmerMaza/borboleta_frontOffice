import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Params } from '../interface/core.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Category, CategoryModel } from '../interface/category.interface';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  public searchSkeleton: boolean = false;

  constructor(private http: HttpClient) {}

  getCategories(payload?: Params): Observable<CategoryModel> {
    return this.http.get<CategoryModel>(`${environment.URLS}/categories`, {
      params: payload,
    });
  }
    
  getCategoryBySlug(slug: string): Observable<Category> {
    return this.http.get<Category>(
      `${environment.URLS}/slug/${slug}`
    );
  }
}
