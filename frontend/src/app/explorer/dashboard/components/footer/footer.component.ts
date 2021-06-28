import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  footer: string = '';
  constructor() {
    let { footer } = JSON.parse(localStorage.getItem('configs'));
    this.footer = footer;
  }
}
