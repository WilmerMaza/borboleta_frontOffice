import { Component, inject, Input } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Category, CategoryModel } from '../../../../interface/category.interface';
import { GetHeaderCategories } from '../../../../store/action/category.action';
import { CategoryState } from '../../../../store/state/category.state';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-header-categories',
    imports: [RouterModule, CommonModule],
    templateUrl: './header-categories.component.html',
    styleUrl: './header-categories.component.scss'
})
export class HeaderCategoriesComponent {

  headerCategory$: Observable<CategoryModel> = inject(Store).select(CategoryState.headerCategory);

  @Input() categoryIds?: (string | number)[];

  public categories: Category[];

  constructor(private store: Store){}

  ngOnInit(){
    this.store.dispatch(new GetHeaderCategories());

    this.headerCategory$.subscribe((res) => {
      if(res && res.data){
        this.categories = res.data.filter(category => category.status === true);
      }
    })
  }
}
