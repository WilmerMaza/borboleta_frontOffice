import { inject, Injectable, ViewChild } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';

// import { LoginModalComponent } from '../../shared/components/widgets/modal/login-modal/login-modal.component';
import { AuthService } from '../../shared/services/auth.service';
import { GetUserDetails } from '../../shared/store/action/account.action';
import { AuthState } from 'src/app/shared/store/state/auth.state';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard{

  access_token$: Observable<String> = inject(Store).select(AuthState.accessToken) as Observable<String>;
  public is_redirect: boolean;

  // @ViewChild("loginModal") LoginModal: LoginModalComponent;

  constructor(private store: Store,
    private router: Router,
    private modal: NgbModal,
    private authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Store the attempted URL for redirecting after login
    this.authService.redirectUrl = state.url;

    // Check if user is authenticated
    const token = this.store.selectSnapshot(state => state.auth?.access_token);
    
    if (!token || token === '' || token === null) {
      // No token, redirect to login
      this.authService.isLogin = true;
      this.router.navigate(['/account/login']);
      return false;
    }

    // Token exists, verify it's still valid by getting user details
    this.store.dispatch(new GetUserDetails());
    return true;
  }

  canActivateChild(route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean | UrlTree {
    if (!!this.store.selectSnapshot(state => state.auth && state.auth.access_token)) {
      if(this.router.url.startsWith('/account') || this.router.url == '/checkout' || this.router.url == '/compare')
        this.router.navigate(['/']);
      return false;
    }
    return true;
  }
}
