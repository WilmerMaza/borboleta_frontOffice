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
    return this.http.get<Category>(`${environment.URLS}/categories/slug/${slug}`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(`${environment.URL}/categories`, category);
  }

  updateCategory(category: Category, id: number): Observable<Category> {
    return this.http.put<Category>(`${environment.URL}/categories/${id}`, category);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${environment.URL}/categories/${id}`);
  }
}


