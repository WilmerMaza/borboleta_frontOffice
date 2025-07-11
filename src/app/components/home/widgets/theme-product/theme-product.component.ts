import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';

import { ProductBoxComponent } from '../../../../shared/components/widgets/product-box/product-box.component';

import { Product } from '../../../../shared/interface/product.interface';
import { ProductService } from '../../../../shared/services/product.service';
import { ProductState } from '../../../../shared/store/state/product.state';
import { NoDataComponent } from '../../../../shared/components/widgets/no-data/no-data.component';
import { horizontalProductSlider, productSlider } from '../../../../shared/data/owl-carousel';
import { TranslateModule } from '@ngx-translate/core';


@Component({
    selector: 'app-theme-product',
    imports: [CommonModule, ProductBoxComponent, CarouselModule, NoDataComponent, TranslateModule],
    templateUrl: './theme-product.component.html',
    styleUrl: './theme-product.component.scss'
})
export class ThemeProductComponent {

  @Input() productIds: number[] = [];
  @Input() style: string;
  @Input() options: OwlOptions = productSlider;
  @Input() slider: boolean;
  @Input() class: string;
  @Input() type: string;
  @Input() product_box_style: string;

  public products: Product[] = [];
  public horizontalSliderOption = horizontalProductSlider;

  product$: Observable<Product[]> = inject(Store).select(ProductState.productByIds);

  constructor(public productService: ProductService) {}

  ngOnChanges() {
    console.log('=== DEBUG ThemeProductComponent ngOnChanges ===');
    console.log('this.productIds:', this.productIds);
    console.log('Tipo de productIds:', typeof this.productIds);
    console.log('Es array:', Array.isArray(this.productIds));
    
    if (Array.isArray(this.productIds) && this.productIds.length) {
      this.product$.subscribe(products => {
        console.log('Productos del estado:', products);
        console.log('Productos filtrados por IDs:', this.productIds);
        console.log('Tipos de IDs en productos:', products.map(p => ({ id: p.id, tipo: typeof p.id })));
        
        this.products = products.filter(product => {
          const productAny = product as any;
          const numericId = productAny.numeric_id;
          
          console.log('=== COMPARACIÓN DE IDs ===');
          console.log('numeric_id del producto:', numericId);
          console.log('productIds que llegan:', this.productIds);
          console.log('Tipo de numeric_id:', typeof numericId);
          console.log('Tipo de productIds:', typeof this.productIds);
          
          const matches = this.productIds?.includes(numericId);
          console.log(`Producto ${numericId} (${product.name}): ${matches ? 'INCLUIDO' : 'EXCLUIDO'}`);
          return matches;
        });
        
        console.log('Productos finales filtrados:', this.products);
      });
    }
  }
}
