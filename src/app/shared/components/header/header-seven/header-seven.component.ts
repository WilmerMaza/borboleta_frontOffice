import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, HostListener, Inject, Input, PLATFORM_ID } from '@angular/core';

import { Option } from '../../../interface/theme-option.interface';


import { MenuService } from '../../../services/menu.service';
import { MenuComponent } from '../../widgets/menu/menu.component';
import { CartComponent } from '../widgets/cart/cart.component';
import { HeaderLogoComponent } from '../widgets/header-logo/header-logo.component';
import { SearchComponent } from '../widgets/search/search.component';
import { SettingsComponent } from '../widgets/settings/settings.component';
import { UserProfileComponent } from '../widgets/user-profile/user-profile.component';

@Component({
    selector: 'app-header-seven',
    imports: [CommonModule, HeaderLogoComponent, MenuComponent,
        SearchComponent, SettingsComponent, CartComponent,
        UserProfileComponent],
    templateUrl: './header-seven.component.html',
    styleUrl: './header-seven.component.scss'
})
export class HeaderSevenComponent {

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

  mainMenuOpen(){
    this.menuService.mainMenuToggle = true;
  }
}
