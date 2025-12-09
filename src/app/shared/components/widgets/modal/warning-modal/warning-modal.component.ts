import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../button/button.component';

@Component({
    selector: 'app-warning-modal',
    imports: [TranslateModule, ButtonComponent],
    templateUrl: './warning-modal.component.html',
    styleUrl: './warning-modal.component.scss'
})
export class WarningModalComponent {

  @Input() title: string = 'Advertencia';
  @Input() message: string = '';

  constructor(
    public activeModal: NgbActiveModal
  ) { }

  close() {
    this.activeModal.close();
  }

}

