import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
})
export class RootComponent implements OnInit {
  currentRouteParent: string;
  index_name: string;
  dashboard_name: string;

  constructor(private router: Router, private activeRoute: ActivatedRoute) {
    router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.setCurrentRoutSettings();
      }
    });
  }

  ngOnInit() {
    this.setCurrentRoutSettings();
  }

  setCurrentRoutSettings() {
    this.index_name =
      this.activeRoute.snapshot.firstChild.paramMap.get('index_name');
    this.dashboard_name =
      this.activeRoute.snapshot.firstChild.paramMap.get('dashboard_name');
    this.currentRouteParent =
      this.activeRoute.snapshot.firstChild?.data?.parentRoute;
  }
}
