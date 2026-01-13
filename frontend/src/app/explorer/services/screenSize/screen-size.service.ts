import { Injectable, inject } from '@angular/core';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState,
} from '@angular/cdk/layout';

@Injectable({
  providedIn: 'root',
})
export class ScreenSizeService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  isSmallScreen: boolean;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.subToScreenSize();
  }

  private subToScreenSize(): void {
    this.breakpointObserver
      .observe([Breakpoints.Small, Breakpoints.XSmall])
      .subscribe((result: BreakpointState) => {
        if (result.matches) {
          this.isSmallScreen = true;
        } else {
          this.isSmallScreen = false;
        }
      });
  }
}
