import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  footer = '';
  constructor() {
    const { footer } = JSON.parse(localStorage.getItem('configs'));
    this.footer = footer;
  }
}
