import {  Component, Input } from '@angular/core';
import { Params } from '../../../../../../shared/interface/core.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { Attribute } from '../../../../../../shared/interface/attribute.interface';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-collection-attribute-filter',
    imports: [CommonModule],
    templateUrl: './collection-attribute-filter.component.html',
    styleUrl: './collection-attribute-filter.component.scss'
})
export class CollectionAttributeFilterComponent {

  @Input() attribute: Attribute;
  @Input() filter: Params;

  public selectedAttributes: string[] = [];

  constructor(private route: ActivatedRoute,
    private router: Router){
  }

  ngOnChanges() {
    this.selectedAttributes = this.filter['attribute'] ? this.filter['attribute'].split(',') : [];
  }

  applyFilter(event: Event) {
    const value = (<HTMLInputElement>event?.target)?.value;
    const isChecked = (<HTMLInputElement>event?.target)?.checked;
    const index = this.selectedAttributes.indexOf(value);

    if (isChecked) {
      if (index === -1) this.selectedAttributes.push(value);
    } else {
      if (index >= 0) this.selectedAttributes.splice(index, 1);
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        attribute: this.selectedAttributes.length ? this.selectedAttributes.join(',') : null,
        page: 1
      },
      queryParamsHandling: 'merge',
      skipLocationChange: false
    });
  }

  // check if the item are selected
  checked(item: string){
    if(this.selectedAttributes?.indexOf(item) != -1){
      return true;
    }
    return false;
  }

}
