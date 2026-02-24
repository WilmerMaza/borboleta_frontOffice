import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { filter } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
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
export class HeaderCategoriesComponent implements OnInit, OnDestroy {

  headerCategory$: Observable<CategoryModel> = inject(Store).select(CategoryState.headerCategory);

  @Input() categoryIds: number[];

  public categories: Category[] = [];
  expandedCategoryId: number | null = null;
  private navSub: Subscription | null = null;

  constructor(private store: Store, private router: Router){}

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe(() => { this.expandedCategoryId = null; });

    this.store.dispatch(new GetHeaderCategories({
      status: 1,
      ids: this.categoryIds?.join(','),
      include: 'subcategories'
    }));

    if (this.categoryIds && this.categoryIds.length) {
      this.headerCategory$.subscribe((res) => {
        if (res) {
          this.categories = res.data.filter(category => this.categoryIds?.includes(category.id));
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  onCategoryClick(event: Event, categoryId: number): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 1199) {
      event.preventDefault();
      this.toggleExpand(categoryId);
    }
  }

  toggleExpand(categoryId: number): void {
    this.expandedCategoryId = this.expandedCategoryId === categoryId ? null : categoryId;
  }
}
