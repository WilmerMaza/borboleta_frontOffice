import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { DeliveryBlock, Values } from '../../../../shared/interface/setting.interface';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-delivery-block',
    imports: [CommonModule, TranslateModule],
    templateUrl: './delivery-block.component.html',
    styleUrl: './delivery-block.component.scss'
})
export class DeliveryBlockComponent {

  @Input() setting: Values;

  @Output() selectDelivery: EventEmitter<DeliveryBlock> = new EventEmitter();

  public deliveryType: string | null = null;
  public delivery_description: string | null = null;
  public delivery_interval: string | null = null;

  private translate = inject(TranslateService);

  ngOnInit() {
    const description = this.getStandardDescription();
    this.delivery_description = description;
    this.selectDelivery.emit({
      delivery_description: description,
      delivery_interval: this.delivery_interval,
    });
  }

  private getStandardDescription(): string {
    return `${this.translate.instant('standard_delivery')} | ${this.translate.instant('delivery_dispatch_time')}`;
  }

  private getNationalDescription(): string {
    return `${this.translate.instant('national_delivery')} | ${this.translate.instant('delivery_time_carrier')}`;
  }

  setDeliveryDescription(type: 'standard' | 'national') {
    this.delivery_description = type === 'standard' ? this.getStandardDescription() : this.getNationalDescription();
    this.deliveryType = type;
    this.selectDelivery.emit({
      delivery_description: this.delivery_description,
      delivery_interval: this.delivery_interval,
    });
  }

}
