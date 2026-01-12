import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { IconTextLoopComponent } from './icon-text-loop/icon-text-loop.component';


@Component({
    selector: 'app-icons-with-text',
    templateUrl: './icons-with-text.component.html',
    styleUrls: ['./icons-with-text.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
    IconTextLoopComponent,
    MatCard,
    MatCardContent
],
})
export class IconsWithTextComponent {
  strWithIcons: string[];
  @Input() set text(str: string) {
    this.strWithIcons = str
      .trim()
      .split(' ')
      .filter((s: string) => s.length);
  }
  @Input() onlyText?: boolean;
}
