import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserAddress } from '../../../../shared/interface/user.interface';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-address-block',
    imports: [CommonModule, TranslateModule],
    templateUrl: './address-block.component.html',
    styleUrl: './address-block.component.scss'
})
export class AddressBlockComponent {

  @Input() addresses?: UserAddress[] = [];
  @Input() type: string = 'shipping';

  @Output() selectAddress: EventEmitter<number> = new EventEmitter();

  constructor() { }

  ngOnChanges() {
    console.log('AddressBlockComponent ngOnChanges() - Addresses:', this.addresses);
    console.log('AddressBlockComponent ngOnChanges() - Type:', this.type);
    // Automatically emit the selectAddress event for the first item if it's available
    if (this.addresses && this.addresses.length > 0) {
      const firstAddressId = this.addresses[0].id;
      console.log('AddressBlockComponent ngOnChanges() - Emitting first address ID:', firstAddressId);
      this.selectAddress.emit(firstAddressId);
    }
  }

  set(event: Event) {
    const selectedId = Number((<HTMLInputElement>event.target)?.value);
    console.log('AddressBlockComponent set() - Selected address ID:', selectedId);
    this.selectAddress.emit(selectedId);
  }

}
