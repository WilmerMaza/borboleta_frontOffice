import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Menu } from '../../../../interface/menu.interface';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-link-box',
    imports: [CommonModule, TranslateModule],
    templateUrl: './link-box.component.html',
    styleUrl: './link-box.component.scss'
})
export class LinkBoxComponent {

  @Input() menu: Menu

  constructor(private router: Router) {}

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
