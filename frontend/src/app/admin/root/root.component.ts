import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MatNavList, MatListItem } from '@angular/material/list';
import { MatDrawerContainer, MatDrawer, MatDrawerContent } from '@angular/material/sidenav';
import { LoadingBarModule } from '@ngx-loading-bar/core';

@Component({
    selector: 'app-root',
    templateUrl: './root.component.html',
    styleUrls: ['./root.component.scss'],
    imports: [
        LoadingBarModule,
        MatDrawerContainer,
        MatDrawer,
        MatNavList,
        MatListItem,
        RouterLink,
        RouterLinkActive,
        MatDrawerContent,
        RouterOutlet
    ]
})
export class RootComponent implements OnInit {
  currentRouteParent: string;
  index_name: string;
  dashboard_name: string;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
  ) {
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
