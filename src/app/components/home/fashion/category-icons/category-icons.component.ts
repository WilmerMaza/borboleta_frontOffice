import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-category-icons',
  templateUrl: './category-icons.component.html',

  styleUrls: ['./category-icons.component.scss']
})
export class CategoryIconsComponent {
  @Input() data: any;
}