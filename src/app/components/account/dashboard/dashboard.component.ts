import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { AccountState } from '../../../shared/store/state/account.state';
import { OrderState } from '../../../shared/store/state/order.state';
import { Observable } from 'rxjs';
import { User, UserAddress } from '../../../shared/interface/user.interface';
import { TranslateModule } from '@ngx-translate/core';
import { CurrencySymbolPipe } from '../../../shared/pipe/currency.pipe';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditProfileModalComponent } from '../../../shared/components/widgets/modal/edit-profile-modal/edit-profile-modal.component';
import { ChangePasswordModalComponent } from '../../../shared/components/widgets/modal/change-password-modal/change-password-modal.component';
import { GetOrders } from '../../../shared/store/action/order.action';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, TranslateModule, CurrencySymbolPipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  user$: Observable<User> = inject(Store).select(AccountState.user) as Observable<User>;
  orders$: Observable<any> = inject(Store).select(OrderState.order) as Observable<any>;

  public address: UserAddress | null;
  public totalOrders: number = 0;

  constructor(private modal: NgbModal, private store: Store) {
    this.user$.subscribe(user => {
      this.address = user?.address?.length ? user?.address?.[0] : null;
    });
  }

  ngOnInit(): void {
    // Cargar las órdenes para obtener el conteo real
    this.store.dispatch(new GetOrders({ page: 1, paginate: 1000 })); // Cargar todas las órdenes
    
    // Suscribirse a los cambios en las órdenes
    this.orders$.subscribe(orders => {
      if (orders?.data?.length >= 0) {
        this.totalOrders = orders.data.length;
      }
    });
  }

  openModal(value: string){
    if(value == 'profile'){
      this.modal.open(EditProfileModalComponent, { centered: true, windowClass: 'theme-modal-2' })
    }else if(value == 'password'){
      this.modal.open(ChangePasswordModalComponent, { centered: true, windowClass: 'theme-modal-2' })
    }
  }

}
