import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../button/button.component';

@Component({
    selector: 'app-order-success-modal',
    imports: [TranslateModule, ButtonComponent],
    templateUrl: './order-success-modal.component.html',
    styleUrl: './order-success-modal.component.scss'
})
export class OrderSuccessModalComponent {

  constructor(
    public activeModal: NgbActiveModal,
    private router: Router
  ) { }

  goToOrders() {
    this.activeModal.close();
    this.router.navigate(['/account/order'], { 
      queryParams: { order_created: 'true' }
    });
  }

}

