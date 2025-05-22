import { Component, Input } from '@angular/core';
import { Option } from '../../../../interface/theme-option.interface';
import { environment } from '../../../../../../environments/environment';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-footer-payment-options',
    imports: [TranslateModule],
    templateUrl: './footer-payment-options.component.html',
    styleUrl: './footer-payment-options.component.scss'
})
export class FooterPaymentOptionsComponent {

  @Input() data: Option | null;

  public StorageURL = environment.storageURL;
  
}
