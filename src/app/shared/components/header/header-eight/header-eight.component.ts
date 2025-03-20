import { Component, HostListener, Inject, Input, PLATFORM_ID } from '@angular/core';
import { MenuComponent } from '../../widgets/menu/menu.component';
import { Option } from '../../../interface/theme-option.interface';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchComponent } from '../widgets/search/search.component';
import { CartComponent } from '../widgets/cart/cart.component';
import { UserProfileComponent } from '../widgets/user-profile/user-profile.component';
import { HeaderLogoComponent } from '../widgets/header-logo/header-logo.component';
import { TranslateModule } from '@ngx-translate/core';
import { MenuService } from '../../../services/menu.service';

@Component({
    selector: 'app-header-eight',
    imports: [CommonModule, RouterModule, TranslateModule, MenuComponent,
        SearchComponent, CartComponent, UserProfileComponent,
        HeaderLogoComponent
    ],
    templateUrl: './header-eight.component.html',
    styleUrl: './header-eight.component.scss'
})
export class HeaderEightComponent {

  @Input() data: Option | null;
  @Input() logo: string | null | undefined;
  @Input() class: string;
  @Input() sticky: boolean | number | undefined; // Default false

  public stick: boolean = false;
  public isBrowser: boolean;

  constructor(public menuService:MenuService, @Inject(PLATFORM_ID) platformId: object){
    this.isBrowser = isPlatformBrowser(platformId);
  }
  // @HostListener Decorator
  @HostListener("window:scroll", [])
  onWindowScroll() {
    if(this.isBrowser) {
      let number = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (number >= 50 && window.innerWidth > 400) {
        this.stick = true;
      } else {
        this.stick = false;
      }
    }
  }

  toggleMenu(value: boolean){
    this.menuService.mainMenuToggle = value;
  }

}
