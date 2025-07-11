import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngxs/store';
import { forkJoin, of } from 'rxjs';

import { ImageLinkComponent } from '../../../../shared/components/widgets/image-link/image-link.component';
import { ThemeBrandComponent } from '../../widgets/theme-brand/theme-brand.component';
import { ThemeHomeSliderComponent } from '../../widgets/theme-home-slider/theme-home-slider.component';
import { ThemeProductTabSectionComponent } from '../../widgets/theme-product-tab-section/theme-product-tab-section.component';
import { ThemeProductComponent } from '../../widgets/theme-product/theme-product.component';
import { ThemeServicesComponent } from '../../widgets/theme-services/theme-services.component';
import { ThemeSocialMediaComponent } from '../../widgets/theme-social-media/theme-social-media.component';
import { ThemeTitleComponent } from '../../widgets/theme-title/theme-title.component';

import { FashionOne } from '../../../../shared/interface/theme.interface';

import { ThemeOptionService } from '../../../../shared/services/theme-option.service';


import { GetBrands } from '../../../../shared/store/action/brand.action';
import { GetCategories } from '../../../../shared/store/action/category.action';
import { GetProducts } from '../../../../shared/store/action/product.action';

@Component({
    selector: 'app-fashion-1',
    providers: [Store],
    imports: [CommonModule, ThemeHomeSliderComponent, 
        ThemeTitleComponent, ThemeProductComponent, ThemeProductTabSectionComponent, ThemeServicesComponent,
        ThemeBrandComponent, ImageLinkComponent],
    templateUrl: './fashion-1.component.html',
    styleUrl: './fashion-1.component.scss'
})
export class Fashion1Component {

  @Input() data?: FashionOne;
  @Input() slug?: string;

  private platformId: boolean;

  constructor(private store: Store,
    @Inject(PLATFORM_ID) platformId: Object,
    private themeOptionService: ThemeOptionService) {
      this.platformId = isPlatformBrowser(platformId);
    }

  ngOnInit() {
    console.log('=== DEBUG ngOnInit ===');
    console.log('this.data:', this.data);
    console.log('this.slug:', this.slug);
    console.log('this.data?.content?.products_list:', this.data?.content?.products_list);
    console.log('this.data?.content?.products_ids:', this.data?.content?.products_ids);
    console.log('¿Se ejecuta el componente?', 'SÍ');
    
    if(this.data?.slug == this.slug) {

      // Get Products
      let getProducts$
      console.log('=== DEBUG GetProducts ===');
      console.log('this.data?.content?.products_list?.status:', this.data?.content?.products_list?.status);
      
      if(this.data?.content?.products_list?.status){
        // Cargar productos dinámicamente sin IDs específicos
        const params = {
          status: 1,
          approve: 1,
          paginate: 10 // Cargar 10 productos
        };
        console.log('Cargando productos dinámicamente:', params);
        getProducts$ = this.store.dispatch(new GetProducts(params)).pipe(
          tap((result: any) => {
            // Extraer los numeric_id de los productos obtenidos
            if (result && result.product && result.product.data) {
              const numericIds = result.product.data.map((product: any) => {
                // Usar _id si existe, sino usar id, sino 0
                return parseInt(product._id) || product.id || 0;
              }).filter((id: number) => id > 0); // Filtrar IDs válidos
              
              console.log('Numeric IDs obtenidos dinámicamente:', numericIds);
              
              // Actualizar el array products_ids con los numeric_id obtenidos
              if (this.data?.content) {
                this.data.content.products_ids = numericIds;
                console.log('products_ids actualizado:', this.data.content.products_ids);
              }
            }
          })
        );
      } else { 
        console.log('No se ejecuta GetProducts - condición no cumplida');
        getProducts$ = of(null); 
      }

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
    console.log('=== FIN DE ngOnInit ===');
  }
}
