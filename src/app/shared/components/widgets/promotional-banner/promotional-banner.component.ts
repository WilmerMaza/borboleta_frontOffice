import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-promotional-banner',
    imports: [CommonModule],
    templateUrl: './promotional-banner.component.html',
    styleUrl: './promotional-banner.component.scss'
})
export class PromotionalBannerComponent {
  @Input() text = 'Entrega mismo día Cartagena y envíos a todo el país';
  @Input() background_color = '#212121';
  @Input() text_color = '#ffffff';
  @Input() font_family = '';
}

