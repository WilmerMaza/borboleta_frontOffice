import { Component, Input } from '@angular/core';
import { Params } from '../../../../../../shared/interface/core.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { TextConverterPipe } from '../../../../../../shared/pipe/text-converter.pipe';

@Component({
    selector: 'app-collection-filter',
    imports: [CommonModule, TranslateModule, TextConverterPipe],
    templateUrl: './collection-filter.component.html',
    styleUrl: './collection-filter.component.scss'
})
export class CollectionFilterComponent {

  @Input() filter: Params;
  public filters: string[];

  public filtersObj: { [key: string]: string[] } = {
    category: [],
    brand: [],
    tag: [],
    rating: [],
    price: [],
    attribute: []
  };

  constructor(private route: ActivatedRoute,
    private router: Router) {}

  ngOnChanges() {
    this.filtersObj = {
      category: this.splitFilter('category'),
      brand: this.splitFilter('brand'),
      tag: this.splitFilter('tag'),
      rating: this.splitFilter('rating'),
      price: this.splitFilter('price'),
      attribute: this.splitFilter('attribute')
    };

    this.filters = this.mergeFilters();
  }

  remove(tag: string) {
    Object.keys(this.filtersObj).forEach((key) => {
      this.filtersObj[key] = this.filtersObj[key].filter((val: string) => {
        if (key === 'rating') {
          return val !== tag.replace(/^rating /, '');
        }
        return val !== tag;
      });
    });

    this.filters = this.mergeFilters();

    const params: Params = {};
    Object.keys(this.filtersObj).forEach((key) => {
      params[key] = this.filtersObj[key].length ? this.filtersObj[key]?.join(',') : null;
    });

    // En página de categoría: si quitamos la categoría, poner show_all=1 para cargar todos los productos
    const isCategoryPage = this.router.url.includes('/category/');
    if (isCategoryPage && !params['category']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { ...params, show_all: '1', page: 1 },
        queryParamsHandling: '',
        skipLocationChange: false
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: 'merge',
        skipLocationChange: false
      });
    }
  }

  clear() {
    const isCategoryPage = this.router.url.includes('/category/');
    if (isCategoryPage) {
      // En categoría: Limpiar todo → mostrar todos los productos en la misma página
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { show_all: '1', page: 1 },
        queryParamsHandling: '',
        skipLocationChange: false
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        queryParamsHandling: '',
        skipLocationChange: false
      });
    }
  }

  private splitFilter(filterKey: keyof Params): string[] {
    return this.filter && this.filter[filterKey] ? this.filter[filterKey].split(',') : [];
  }

  private mergeFilters(): string[] {
    return [
      ...this.filtersObj['category'],
      ...this.filtersObj['brand'],
      ...this.filtersObj['tag'],
      ...this.filtersObj['rating'].map(val => val.startsWith('rating ') ? val : `rating ${val}`),
      ...this.filtersObj['price'],
      ...this.filtersObj['attribute']
    ];
  }

  formatFilters(filters: string): string {
    if (!filters) return ''; // Handle edge cases like empty or undefined filters

    return filters.split('-')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
  }

}
