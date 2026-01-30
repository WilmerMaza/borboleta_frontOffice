import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { BreadcrumbComponent } from '../../../shared/components/widgets/breadcrumb/breadcrumb.component';
import { LoaderComponent } from '../../../shared/components/widgets/loader/loader.component';
import { NoDataComponent } from '../../../shared/components/widgets/no-data/no-data.component';
import { ProductCartButtonComponent } from '../../../shared/components/widgets/product-box/widgets/product-cart-button/product-cart-button.component';
import { breadcrumb } from '../../../shared/interface/breadcrumb.interface';
import { Option } from '../../../shared/interface/theme-option.interface';
import { WishlistModel } from '../../../shared/interface/wishlist.interface';
import { CurrencySymbolPipe } from '../../../shared/pipe/currency.pipe';
import { WishlistService } from '../../../shared/services/wishlist.service';
import { DeleteWishlist, GetWishlist } from '../../../shared/store/action/wishlist.action';
import { ThemeOptionState } from '../../../shared/store/state/theme-option.state';
import { WishlistState } from '../../../shared/store/state/wishlist.state';

@Component({
    selector: 'app-wishlist',
    imports: [CommonModule, RouterModule, CurrencySymbolPipe, TranslateModule,
        BreadcrumbComponent, NoDataComponent, ProductCartButtonComponent, LoaderComponent],
    templateUrl: './wishlist.component.html',
    styleUrl: './wishlist.component.scss'
})
export class WishlistComponent {

  wishlistItems$: Observable<WishlistModel> = inject(Store).select(WishlistState.wishlistItems);
  themeOption$: Observable<Option> = inject(Store).select(ThemeOptionState.themeOptions) as Observable<Option>;

  public breadcrumb: breadcrumb = {
    title: "Wishlist",
    items: [{ label: 'Wishlist', active: true }]
  };

  public skeletonItems = Array.from({ length: 12 }, (_, index) => index);

  constructor(
    private store: Store,
    public wishlistService: WishlistService
  ) {}

  ngOnInit() {
    this.store.dispatch(new GetWishlist());
  }

  removeWishlist(id: number){
    this.store.dispatch(new DeleteWishlist(id));
  }

}
