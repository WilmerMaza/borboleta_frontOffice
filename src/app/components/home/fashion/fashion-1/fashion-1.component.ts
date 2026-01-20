import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { ImageLinkComponent } from '../../../../shared/components/widgets/image-link/image-link.component';
import { ThemeHomeSliderComponent } from '../../widgets/theme-home-slider/theme-home-slider.component';
import { ThemeProductTabSectionComponent } from '../../widgets/theme-product-tab-section/theme-product-tab-section.component';
import { ThemeProductComponent } from '../../widgets/theme-product/theme-product.component';
import { ThemeTitleComponent } from '../../widgets/theme-title/theme-title.component';
import { FashionOne } from '../../../../shared/interface/theme.interface';
import { ThemeOptionService } from '../../../../shared/services/theme-option.service';
import { GetBrands } from '../../../../shared/store/action/brand.action';
import { GetCategories } from '../../../../shared/store/action/category.action';
import { GetProductByIds } from '../../../../shared/store/action/product.action';

@Component({
    selector: 'app-fashion-1',
    providers: [Store],
    imports: [CommonModule, RouterModule, TranslateModule, ThemeHomeSliderComponent, 
        ThemeTitleComponent, ThemeProductComponent, ThemeProductTabSectionComponent, 
         ImageLinkComponent],
    templateUrl: './fashion-1.component.html',
    styleUrl: './fashion-1.component.scss'
})
export class Fashion1Component {

  @Input() data?: FashionOne;
  @Input() slug?: string;

  private platformId: boolean;

  public newCollectionSlider: OwlOptions = {
    loop: false, // Cambiado a false para evitar el error cuando hay pocos items
    nav: true,
    dots: false,
    margin: 24,
    navText: [
      "<i class='ri-arrow-left-s-line'></i>",
      "<i class='ri-arrow-right-s-line'></i>",
    ],
    items: 4,
    responsive: {
      0: {
        items: 1,
        margin: 16,
        autoHeight: true,
        loop: false,
      },
      576: {
        items: 2,
        margin: 16,
        loop: false,
      },
      768: {
        items: 3,
        margin: 20,
        loop: false,
      },
      992: {
        items: 4,
        margin: 24,
        loop: false,
      },
    },
  };

  constructor(private store: Store,
    @Inject(PLATFORM_ID) platformId: Object,
    private themeOptionService: ThemeOptionService) {
      this.platformId = isPlatformBrowser(platformId);
    }

  ngOnInit() {
    if(this.data?.slug == this.slug) {

      // Get Products
      let getProducts$
      if(this.data?.content?.products_ids?.length && this.data?.content?.products_list?.status){
        getProducts$ = this.store.dispatch(new GetProductByIds({
          status: 1,
          approve: 1,
          ids: this.data?.content?.products_ids?.join(','),
          paginate: this.data?.content?.products_ids?.length
        }));
      } else { getProducts$ = of(null); }

      // Get Category
      let getCategory$;
      if(this.data?.content.category_product.category_ids?.length && this.data?.content.category_product?.status){
        getCategory$ = this.store.dispatch(new GetCategories({
          status: 1,
          ids: this.data?.content.category_product.category_ids?.join(',')
        }))
      } else { getCategory$ = of(null); }

      // Get Brand
      let getBrands$;
      if(this.data?.content?.brand?.brand_ids?.length && this.data?.content?.brand?.status) {
        getBrands$ = this.store.dispatch(new GetBrands({
          status: 1,
          ids: this.data?.content?.brand?.brand_ids?.join(',')
        }));
      } else { getBrands$ = of(null); }


    }
  }
}
