import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CurrencySymbolPipe } from '../../../../../../shared/pipe/currency.pipe';

@Component({
    selector: 'app-collection-price-filter',
    imports: [CommonModule, CurrencySymbolPipe],
    templateUrl: './collection-price-filter.component.html',
    styleUrl: './collection-price-filter.component.scss'
})
export class CollectionPriceFilterComponent {

  @Input() filter: Params;

  public prices = [
    {
      id: 1,
      price: 50000,
      text: 'Below',
      value: '50000'
    },
    {
      id: 2,
      minPrice: 50000,
      maxPrice: 100000,
      value: '50000-100000'
    },
    {
      id: 3,
      minPrice: 100000,
      maxPrice: 200000,
      value: '100000-200000'
    },
    {
      id: 4,
      minPrice: 200000,
      maxPrice: 500000,
      value: '200000-500000'
    },
    {
      id: 5,
      minPrice: 500000,
      maxPrice: 1000000,
      value: '500000-1000000'
    },
    {
      id: 6,
      minPrice: 1000000,
      maxPrice: 2000000,
      value: '1000000-2000000'
    },
    {
      id: 7,
      price: 2000000,
      text: 'Above',
      value: '2000000'
    }
  ]

  public selectedPrices: string[] = [];

  constructor(private route: ActivatedRoute,
    private router: Router) {
  }

  ngOnChanges() {
    this.selectedPrices = this.filter['price'] ? this.filter['price'].split(',') : [];
  }

  applyFilter(event: Event) {
    const value = (<HTMLInputElement>event?.target)?.value;
    const isChecked = (<HTMLInputElement>event?.target)?.checked;
    const index = this.selectedPrices.indexOf(value);

    if (isChecked) {
      if (index === -1) this.selectedPrices.push(value);
    } else {
      if (index >= 0) this.selectedPrices.splice(index, 1);
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        price: this.selectedPrices.length ? this.selectedPrices.join(',') : null,
        page: 1
      },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
  }

  // check if the item are selected
  checked(item: string){
    if(this.selectedPrices?.indexOf(item) != -1){
      return true;
    }
    return false;
  }
}
