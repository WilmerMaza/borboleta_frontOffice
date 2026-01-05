import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Category, CategoryModel } from '../../../../interface/category.interface';
import { GetCategories } from '../../../../store/action/category.action';
import { CategoryState } from '../../../../store/state/category.state';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-footer-categories',
    imports: [CommonModule, RouterModule],
    templateUrl: './footer-categories.component.html',
    styleUrl: './footer-categories.component.scss'
})
export class FooterCategoriesComponent {

  @Input() categoryIds: number[];

  category$: Observable<CategoryModel> = inject(Store).select(CategoryState.category);

  public categories: Category[];

  constructor(private store: Store){}

  ngOnInit(){
    // Obtener todas las categorías de productos activas
    this.store.dispatch(new GetCategories({
      status: 1,
      type: 'product'
    }))

    this.category$.subscribe((res) => {
      if(res && res.data){
        // Mostrar todas las categorías de productos, tengan o no productos
        this.categories = res.data.filter(category => category.type === 'product')
      }
    })
  }


}
