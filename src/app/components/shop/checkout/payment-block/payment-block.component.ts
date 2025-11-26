import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Values } from '../../../../shared/interface/setting.interface';
import { CommonModule } from '@angular/common';
import { WompiButtonComponent, WompiButtonConfig } from '../wompi-button/wompi-button.component';

@Component({
    selector: 'app-payment-block',
    imports: [CommonModule, WompiButtonComponent],
    templateUrl: './payment-block.component.html',
    styleUrl: './payment-block.component.scss'
})
export class PaymentBlockComponent {

  @Input() setting: Values;
  @Input() selectedPaymentMethod: string = '';
  
  // Inputs para el widget de Wompi
  @Input() showWompiWidget: boolean = false;
  @Input() wompiWidgetConfig: WompiButtonConfig | null = null;

  @Output() selectPaymentMethod: EventEmitter<string> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    // Solo emitir automáticamente si no hay un método de pago ya seleccionado
    // Usar setTimeout para evitar ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      if (!this.selectedPaymentMethod && this.setting && this.setting?.payment_methods?.length! > 0) {
        if(this.setting?.payment_methods?.[0].status) {
          this.selectPaymentMethod.emit(this.setting?.payment_methods?.[0].name);
        }
      }
    }, 0);
  }

  set(value: string) {
    this.selectPaymentMethod.emit(value);
  }

  isWompiSelected(): boolean {
    return this.selectedPaymentMethod === 'wompi';
  }

  shouldShowWompiWidget(): boolean {
    return this.isWompiSelected() && this.showWompiWidget && !!this.wompiWidgetConfig;
  }

}
