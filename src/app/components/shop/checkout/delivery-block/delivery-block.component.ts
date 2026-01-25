import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DeliveryBlock, Values } from '../../../../shared/interface/setting.interface';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-delivery-block',
    imports: [CommonModule, TranslateModule],
    templateUrl: './delivery-block.component.html',
    styleUrl: './delivery-block.component.scss'
})
export class DeliveryBlockComponent {

  @Input() setting: Values;

  @Output() selectDelivery: EventEmitter<DeliveryBlock> = new EventEmitter();

  public selectedIndex: number;
  public deliveryType: string | null = null;
  public delivery_description: string | null = null;
  public delivery_interval: string | null = null;

  ngOnInit() {
    // Always emit a default delivery option
    if(this.setting?.delivery?.default?.title){
      let delivery: DeliveryBlock = {
        delivery_description: this.setting.delivery.default.title+ ' | Tiempo de despacho entre 24 a 72 horas después de la compra',
        delivery_interval: this.delivery_interval,
      }
      this.selectDelivery.emit(delivery);
    } else {
      // Emit default delivery if no configuration exists
      let delivery: DeliveryBlock = {
        delivery_description: 'Envío estándar | Tiempo de despacho entre 24 a 72 horas después de cancelado',
        delivery_interval: this.delivery_interval,
      }
      this.selectDelivery.emit(delivery);
    }
  }

  setDeliveryDescription(value: string, type: string) {
    this.delivery_description = value!;
    this.deliveryType = type;
    let delivery: DeliveryBlock = {
      delivery_description: this.delivery_description,
      delivery_interval: this.delivery_interval,
    }
    this.selectDelivery.emit(delivery);
  }

  setDeliveryInterval(value: string, index: number) {
    this.selectedIndex = index!;
    this.delivery_interval = value;
    let delivery : DeliveryBlock = {
      delivery_description: this.delivery_description,
      delivery_interval: this.delivery_interval,
    }
    this.selectDelivery.emit(delivery);
  }

}
