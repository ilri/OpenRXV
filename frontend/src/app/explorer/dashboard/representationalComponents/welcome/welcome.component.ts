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
    this.tourService.start$.subscribe(() => {
        this.tourStarted = true;
        const container = document.getElementsByTagName('mat-sidenav-content');
        if (container.length) {
          container[0].classList.add('ngx-ui-tour-md-menu-no-scroll');
        }
      });
    this.tourService.end$.subscribe(() => {
      const container = document.getElementsByTagName('mat-sidenav-content');
      if (container.length) {
        container[0].classList.remove('ngx-ui-tour-md-menu-no-scroll');
      }
    });
  }

  toggleElement(): void {
    this.tourStarted = !this.tourStarted;
  }
}
