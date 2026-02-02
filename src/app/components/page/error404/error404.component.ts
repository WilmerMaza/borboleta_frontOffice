import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { ThemeOptionState } from '../../../shared/store/state/theme-option.state';
import { Observable } from 'rxjs';
import { breadcrumb } from '../../../shared/interface/breadcrumb.interface';
import { Option } from '../../../shared/interface/theme-option.interface';
import { BreadcrumbComponent } from '../../../shared/components/widgets/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../../shared/components/widgets/button/button.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-error404',
    imports: [CommonModule, TranslateModule, RouterModule, BreadcrumbComponent, ButtonComponent],
    templateUrl: './error404.component.html',
    styleUrl: './error404.component.scss'
})
export class Error404Component {

  themeOption$: Observable<Option> = inject(Store).select(ThemeOptionState.themeOptions) as Observable<Option>;

  public breadcrumb: breadcrumb = {
    title: "404",
    items: [{ label: "404", active: true }]
  };

  constructor(private location: Location, private router: Router) {}

  back() {
    this.location.back();
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
