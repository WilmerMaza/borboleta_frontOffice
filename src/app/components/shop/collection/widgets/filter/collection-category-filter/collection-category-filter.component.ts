import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Category, CategoryModel } from '../../../../../../shared/interface/category.interface';
import { Params } from '../../../../../../shared/interface/core.interface';
import { SearchFilterPipe } from '../../../../../../shared/pipe/search-filter.pipe';
import { CategoryState } from '../../../../../../shared/store/state/category.state';
import { NoDataComponent } from '../../../../../../shared/components/widgets/no-data/no-data.component';
import { GetCategories } from '../../../../../../shared/store/action/category.action';

@Component({
    selector: 'app-collection-category-filter',
    imports: [CommonModule, TranslateModule, FormsModule, SearchFilterPipe, NoDataComponent],
    templateUrl: './collection-category-filter.component.html',
    styleUrl: './collection-category-filter.component.scss'
})
export class CollectionCategoryFilterComponent {

  category$: Observable<CategoryModel> = inject(Store).select(CategoryState.category);

  @Input() filter: Params;

  public categories: Category[];
  public selectedCategories: string[] = [];
  public searchText: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store){
      this.store.dispatch(new GetCategories());
    }

  ngOnInit(){
    this.category$.subscribe(res => {
      this.categories = res.data.filter(category => category.type == 'product')});
  }

  ngOnChanges() {
    this.selectedCategories = this.filter['category'] ? this.filter['category'].split(',') : [];
  }

  applyFilter(event: Event) {
    const value = (<HTMLInputElement>event?.target)?.value;
    const isChecked = (<HTMLInputElement>event?.target)?.checked;
    const index = this.selectedCategories.indexOf(value);

    if (isChecked) {
      // Marcar: agregar solo si no está ya (evita duplicados)
      if (index === -1) {
        this.selectedCategories.push(value);
      }
    } else {
      // Desmarcar: quitar solo si existe (evita splice(-1, 1))
      if (index >= 0) {
        this.selectedCategories.splice(index, 1);
      }
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        category: this.selectedCategories.length ? this.selectedCategories.join(',') : null,
        page: 1
      },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
  }

  // check if the item are selected
  checked(item: string){
    if(this.selectedCategories?.indexOf(item) != -1){
      return true;
    }
    return false;
  }

}
