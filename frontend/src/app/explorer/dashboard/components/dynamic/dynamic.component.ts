import {
  Type,
  Component,
  OnInit,
  Input,
  ComponentFactoryResolver,
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
    private resolver: ComponentFactoryResolver,
    private vcRef: ViewContainerRef,
  ) {}

  ngOnInit() {
    const factoryClass = <Type<any>>ComponentLookupRegistry.get(this.comp);
    if (factoryClass) {
      const factory = this.resolver.resolveComponentFactory(factoryClass);
      const compRef = this.vcRef.createComponent(factory);
      compRef.instance.componentConfigs = this.componentConfigs;
    }
  }
}
