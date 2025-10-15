import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChange, SimpleChanges } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CarouselModule } from 'ngx-owl-carousel-o';

import { homeBannerSlider } from '../../../../shared/data/owl-carousel';

import { ImageLinkComponent } from '../../../../shared/components/widgets/image-link/image-link.component';
import { Banners } from '../../../../shared/interface/theme.interface';
import { environment } from '../../../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-theme-home-slider',
    imports: [CommonModule, RouterModule, CarouselModule, ImageLinkComponent,TranslateModule],
    templateUrl: './theme-home-slider.component.html',
    styleUrl: './theme-home-slider.component.scss'
})
export class ThemeHomeSliderComponent {

  @Input() banners: any;
  @Input() theme: string;

  public options = homeBannerSlider;
  public filteredBanners: Banners[];
  public videoType = ['mp4', 'webm', 'ogg'];
  public StorageURL = environment.storageURL
  
  ngOnChanges(change: SimpleChanges){
    this.filteredBanners = change['banners'].currentValue?.banners?.filter((banner: Banners) => {
      return banner.status
    })
  }

  getVideoUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '';
    
    // Si la URL ya es completa (empieza con http:// o https://), devolverla tal cual
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Detectar URLs de Firebase Storage que pueden venir sin esquema
    // Buscar patrones típicos de Firebase Storage: firebasestorage.googleapis.com o GoogleAccessId
    if (imageUrl.includes('firebasestorage.googleapis.com') || 
        imageUrl.includes('GoogleAccessId=') || 
        imageUrl.includes('storage.googleapis.com')) {
      // Si parece ser una URL de Firebase pero no tiene esquema, añadir https://
      return 'https://' + imageUrl;
    }
    
    // Si es una ruta relativa, concatenar con StorageURL
    return this.StorageURL + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
  }
}
