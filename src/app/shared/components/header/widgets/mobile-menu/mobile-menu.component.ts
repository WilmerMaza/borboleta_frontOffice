import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Category, CategoryModel } from '../../../../interface/category.interface';
import { GetCategories } from '../../../../store/action/category.action';
import { CategoryState } from '../../../../store/state/category.state';
import { AuthService } from '../../../../services/auth.service';
import { ToggleSidebarCart } from '../../../../store/action/cart.action';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-mobile-menu',
    imports: [RouterModule, TranslateModule, CommonModule],
    templateUrl: './mobile-menu.component.html',
    styleUrl: './mobile-menu.component.scss'
})
export class MobileMenuComponent implements OnInit {

  public active: string = '/';
  public showCategories: boolean = false;

  category$: Observable<CategoryModel> = inject(Store).select(CategoryState.category);
  public categories: Category[] = [];

  constructor(private store: Store, private authService: AuthService, private router: Router){}

  ngOnInit() {
    // Obtener categorías
    this.store.dispatch(new GetCategories({ status: 1, type: 'product' }));
    
    this.category$.subscribe(res => {
      if(res && res.data) {
        this.categories = res.data.filter(category => category.type === 'product');
      }
    });
  }

  cartToggle(value: boolean) {
    this.store.dispatch(new ToggleSidebarCart(value));
  }

  activeMenu(menu: string){
    this.active = menu;
  }

  toggleCategories() {
    this.showCategories = !this.showCategories;
    if (this.showCategories) {
      this.activeMenu('categories');
      // Prevenir scroll del body cuando el sidebar está abierto
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  reDirectWishlist(){
    if(!this.store.selectSnapshot(state => state.auth && state.auth.access_token)){
      this.authService.isLogin = true;
    }
    else {
      this.router.navigate(['/wishlist'])
      this.activeMenu('wishlist')
    }
  }
}
