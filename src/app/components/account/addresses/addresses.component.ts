import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { NoDataComponent } from '../../../shared/components/widgets/no-data/no-data.component';
import { AccountUser } from '../../../shared/interface/account.interface';
import { UserAddress } from '../../../shared/interface/user.interface';
import { DeleteAddress, GetAddresses } from '../../../shared/store/action/account.action';
import { AccountState } from '../../../shared/store/state/account.state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddressModalComponent } from '../../../shared/components/widgets/modal/address-modal/address-modal.component';
import { DeleteAddressModalComponent } from '../../../shared/components/widgets/modal/delete-address-modal/delete-address-modal.component';

@Component({
    selector: 'app-addresses',
    imports: [CommonModule, TranslateModule, NoDataComponent],
    templateUrl: './addresses.component.html',
    styleUrl: './addresses.component.scss'
})
export class AddressesComponent implements OnInit {

  user$: Observable<AccountUser> = inject(Store).select(AccountState.user) as Observable<AccountUser>;

  constructor(private store: Store, private modal: NgbModal) {
  }

  ngOnInit(): void {
    // Cargar las direcciones del usuario al inicializar el componente
    console.log('🏠 === CARGANDO DIRECCIONES === 🏠');
    this.store.dispatch(new GetAddresses());
  }

  AddressModal(address?: UserAddress){
    const modal = this.modal.open(AddressModalComponent, { centered: true, windowClass: 'theme-modal-2' })

    if(address){
      modal.componentInstance.userAddress = address;
    }
  }

  removeAddress(address: UserAddress){
    const modal = this.modal.open(DeleteAddressModalComponent, { centered: true })

    if(address){
      modal.componentInstance.userAddress = address;
    }
  }

  delete(action: string, data: UserAddress) {
    if(action == 'delete' && data)
      this.store.dispatch(new DeleteAddress(data.id));
  }
}
