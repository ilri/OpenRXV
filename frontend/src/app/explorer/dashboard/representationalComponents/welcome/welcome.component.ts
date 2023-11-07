import { Component, OnInit, Input } from '@angular/core';
import { TourService } from 'ngx-ui-tour-md-menu';
import { ComponentLookup } from '../../components/dynamic/lookup.registry';
@ComponentLookup('WelcomeComponent')
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
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
