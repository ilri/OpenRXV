import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ComponentLabelConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { ComponentLookup } from '../../dashboard/components/dynamic/lookup.registry';
@ComponentLookup('LabelComponent')
@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelComponent {
  @Input() componentConfigs: ComponentLabelConfigs;
  popoverIsOpen = false;
}
