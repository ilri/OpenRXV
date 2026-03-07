import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ComponentLabelConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { CdkOverlayOrigin, CdkConnectedOverlay } from '@angular/cdk/overlay';
import { MatIcon } from '@angular/material/icon';
import { IconsWithTextComponent } from '../../dashboard/representationalComponents/icons-with-text/icons-with-text.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-label',
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    IconsWithTextComponent,
    MatIcon,
    CdkOverlayOrigin,
    CdkConnectedOverlay,
  ],
})
export class LabelComponent {
  @Input() componentConfigs: ComponentLabelConfigs;
  popoverIsOpen = false;
}
