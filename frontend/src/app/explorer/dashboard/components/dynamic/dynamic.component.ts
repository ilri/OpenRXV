import {
  Type,
  Component,
  OnInit,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { ComponentLookupRegistry } from './lookup.registry';

@Component({
    selector: 'app-dynamic',
    template: '',
    standalone: true,
})
export class DynamicComponent implements OnInit {
  @Input() comp: string;
  @Input() componentConfigs: any;
  constructor(
    private vcRef: ViewContainerRef,
  ) {}

  ngOnInit() {
    const factoryClass = <Type<any>>ComponentLookupRegistry(this.comp);
    if (factoryClass) {
      const compRef = this.vcRef.createComponent(factoryClass);
      compRef.instance.componentConfigs = this.componentConfigs;
    }
  }
}
