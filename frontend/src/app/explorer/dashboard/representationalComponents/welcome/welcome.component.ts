import { Component, OnInit, Input, inject } from '@angular/core';
import { TourService } from 'ngx-ui-tour-md-menu';
import { SafeHtmlPipe } from '../../../pipes/safeHtml.pipe';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
  imports: [
    MatCard,
    MatCardHeader,
    MatIconButton,
    MatIcon,
    MatCardContent,
    SafeHtmlPipe,
  ],
})
export class WelcomeComponent implements OnInit {
  private readonly tourService = inject(TourService);

  tourStarted: boolean;
  @Input() componentConfigs: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    this.tourService.start$.subscribe(() => (this.tourStarted = true));
  }

  toggleElement(): void {
    this.tourStarted = !this.tourStarted;
  }
}
