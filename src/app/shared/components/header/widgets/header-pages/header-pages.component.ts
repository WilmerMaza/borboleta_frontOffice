import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavigationStart, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { Menu } from '../../../../interface/menu.interface';
import { MenuState } from '../../../../store/state/menu.state';
import { Store } from '@ngxs/store';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-header-pages',
  imports: [RouterModule, TranslateModule],
  templateUrl: './header-pages.component.html',
  styleUrl: './header-pages.component.scss'
})
export class HeaderPagesComponent implements OnInit, OnDestroy {

  menu$ = inject(Store).select(MenuState.menu);

  public menuItems: Menu[] = [];
  expandedMenuId: number | undefined | null = null;
  private navSub: Subscription | null = null;

  constructor(private store: Store, private router: Router) {}

  ngOnInit(): void {
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationStart => e instanceof NavigationStart))
      .subscribe(() => { this.expandedMenuId = null; });

    this.menu$.subscribe((res) => {
      if (res?.data) {
        this.menuItems = res.data;
      }
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }

  onMenuClick(event: Event, menuId: number | undefined): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 1199) {
      event.preventDefault();
      this.toggleExpand(menuId);
    }
  }

  toggleExpand(menuId: number | undefined): void {
    this.expandedMenuId = this.expandedMenuId === menuId ? null : menuId;
  }

  isExternalLink(menu: Menu): boolean {
    return (
      menu?.externalLink === true ||
      menu?.is_target_blank === 1 ||
      menu?.is_target_blank === true ||
      (typeof menu?.path === 'string' && (menu.path.startsWith('http://') || menu.path.startsWith('https://')))
    );
  }

  redirect(path: string) {
    if (path?.startsWith('http://') || path?.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      this.router.navigateByUrl(path || '/');
    }
  }
}
