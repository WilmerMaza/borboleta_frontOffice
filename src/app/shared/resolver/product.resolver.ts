import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { GetProductBySlug } from '../store/action/product.action';
import { ProductState } from '../store/state/product.state';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

export const ProductResolver: ResolveFn<Observable<any>> = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const store = inject(Store);
  const slug = route.paramMap.get('slug');

  if (slug) {
    store.dispatch(new GetProductBySlug(slug));
    return store.select(ProductState.selectedProduct);
  }
  
  return of(null);
};
