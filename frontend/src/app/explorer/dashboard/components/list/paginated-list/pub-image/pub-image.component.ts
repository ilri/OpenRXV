import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ESSource } from 'src/app/explorer/filters/services/interfaces';

@Component({
  selector: 'app-pub-image',
  templateUrl: './pub-image.component.html',
  styleUrls: ['./pub-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PubImageComponent {
  @Input() source: ESSource;
  @Input() content: any;
  loading = true;

  onLoad() {
    this.loading = false;
  }
  chooseColor(options: Array<any>, value) {
    const color = options.filter((d) => d.value == value)[0]?.color;
    return color ? color : 'var(--theme-primary-200)';
  }
}
