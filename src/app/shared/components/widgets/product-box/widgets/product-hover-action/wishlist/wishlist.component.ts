import { Component, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Product } from '../../../../../../interface/product.interface';
import { AddToWishlist, DeleteWishlist } from '../../../../../../store/action/wishlist.action';
import { WishlistState } from '../../../../../../store/state/wishlist.state';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-wishlist',
  imports: [TranslateModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.scss'
})
export class WishlistComponent {

  @Input() product: Product;
  @Input() class: string = '';

  constructor(private store: Store) {}

  get isInWishlist(): boolean {
    const ids = this.store.selectSnapshot(WishlistState.wishlistIds) || [];
    return this.product ? ids.includes(this.product.id) : false;
  }

  addToWishlist(product: Product) {
    if (!product) return;
    if (this.isInWishlist) {
      this.store.dispatch(new DeleteWishlist(product.id));
    } else {
      this.store.dispatch(new AddToWishlist({ product }));
    }
  }
}
