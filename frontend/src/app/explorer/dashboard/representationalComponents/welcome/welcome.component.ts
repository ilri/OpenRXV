import { Component, OnInit, Input } from '@angular/core';
import { TourService } from 'ngx-ui-tour-md-menu';
import { ComponentLookup } from '../../components/dynamic/lookup.registry';
import { SafeHtmlPipe } from '../../../pipes/safeHtml.pipe';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';

@ComponentLookup('WelcomeComponent')
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
        SafeHtmlPipe
    ]
})
export class WelcomeComponent implements OnInit {
  tourStarted: boolean;
  @Input() componentConfigs: any;
  constructor(private readonly tourService: TourService) {}

  ngOnInit(): void {
    this.tourService.start$.subscribe(() => (this.tourStarted = true));
  }

  toggleElement(): void {
    this.tourStarted = !this.tourStarted;
  }
}
