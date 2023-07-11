import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsComponent {
  @Input() label: string;
  @Input() labelData: any;
}
