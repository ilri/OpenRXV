import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';


@Component({
    selector: 'app-icon-text-loop',
    templateUrl: './icon-text-loop.component.html',
    styleUrls: ['./icon-text-loop.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatIcon
    ]
})
export class IconTextLoopComponent {
  @Input() strWithIcons: string[];
}
