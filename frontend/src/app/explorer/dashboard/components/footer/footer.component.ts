import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SafeHtmlPipe } from '../../../pipes/safeHtml.pipe';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SafeHtmlPipe],
})
export class FooterComponent {
  footer = '';
  constructor() {
    const { footer } = JSON.parse(localStorage.getItem('configs'));
    this.footer = footer;
  }
}
