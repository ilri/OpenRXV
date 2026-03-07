import {
  Type,
  Component,
  OnInit,
  Input,
  ViewContainerRef,
  inject,
} from '@angular/core';
import { ComponentLookupRegistry } from './lookup.registry';

@Component({
  selector: 'app-dynamic',
  template: '',
  standalone: true,
})
export class DynamicComponent implements OnInit {
  private vcRef = inject(ViewContainerRef);

  @Input() comp: string;
  @Input() componentConfigs: any;
  @Input() dashboard_name?: string;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit() {
    const factoryClass = <Type<any>>ComponentLookupRegistry(this.comp);
    if (factoryClass) {
      const compRef = this.vcRef.createComponent(factoryClass);
      compRef.instance.componentConfigs = this.componentConfigs;
      compRef.instance.dashboard_name = this.dashboard_name;
    }
  }
}
