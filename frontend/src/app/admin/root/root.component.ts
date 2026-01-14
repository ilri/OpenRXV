import { Component, OnInit, inject } from '@angular/core';
import {
  Router,
  ActivatedRoute,
  NavigationEnd,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { MatNavList, MatListItem } from '@angular/material/list';
import {
  MatDrawerContainer,
  MatDrawer,
  MatDrawerContent,
} from '@angular/material/sidenav';
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
    RouterOutlet,
  ],
})
export class RootComponent implements OnInit {
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);

  currentRouteParent: string;
  index_name: string;
  dashboard_name: string;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    const router = this.router;

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
