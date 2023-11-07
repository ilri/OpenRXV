import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../admin/services/settings.service';
import tinycolor from 'tinycolor2';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

import { get } from 'scriptjs';
import { environment } from 'src/environments/environment';
export interface Color {
  name: string;
  hex: string;
  darkContrast: boolean;
}

declare let window: any;
declare let dataLayer: any;

@Component({
  selector: 'app-root',
  templateUrl: './root.component.html',
  styleUrls: ['./root.component.scss'],
})
export class RootComponent implements OnInit {
  favIcon: HTMLLinkElement = document.querySelector('#appIcon');
  loadSettigs = false;
  dashboard_name: string;
  constructor(
    private titleService: Title,
    private readonly settingsService: SettingsService,
    private router: Router,
    private meta: Meta,
    private activeRoute: ActivatedRoute,
  ) {}

  primaryColorPalette;
  async ngOnInit() {
    this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationEnd) {
        this.dashboard_name =
          this.activeRoute.snapshot.firstChild.paramMap.get('dashboard_name');
        const settings = await this.settingsService.readExplorerSettings(
          this.dashboard_name,
        );

        this.favIcon.href = environment.api + '/' + settings.appearance.favIcon;
        await localStorage.setItem('configs', JSON.stringify(settings));
        if (
          (!settings.counters && !settings.dashboard) ||
          settings.dashboard.length == 0
        ) {
          if (!event.urlAfterRedirects.includes('admin'))
            this.router.navigate(['/admin']);
        }
        this.loadSettigs = true;
        if (settings.appearance.primary_color) {
          this.savePrimaryColor(
            settings.appearance.primary_color,
            settings.appearance.secondary_color,
          );
          this.titleService.setTitle(settings.appearance.website_name);
          this.meta.updateTag({
            name: 'og:description',
            content: settings.appearance.description,
          });
        }

        if (settings.appearance.tracking_code) {
          this.setupGoogleAnalytics(settings.appearance.tracking_code);
        }
      }
    });
  }

  setupGoogleAnalytics(tracking_code) {
    get(`https://www.googletagmanager.com/gtag/js?id=${tracking_code}`, () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(param, param2, param3 = null) {
        dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', tracking_code);
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          gtag('config', tracking_code, { page_path: event.urlAfterRedirects });
        }
      });
    });
  }

  savePrimaryColor(color, secondary_color) {
    this.primaryColorPalette = computeColors(color);
    const keys = ['A400', '900', '300', '400', '200'];
    for (const color of this.primaryColorPalette) {
      const key1 = `--theme-primary-${color.name}`;
      let value1 = color.hex;
      const key2 = `--theme-primary-contrast-${color.name}`;
      if (secondary_color && keys.indexOf(color.name) >= 0)
        value1 = secondary_color;
      const value2 = color.darkContrast ? 'rgba(black, 0.87)' : 'white';
      document.documentElement.style.setProperty(key1, value1);
      document.documentElement.style.setProperty(key2, value2);
    }
  }
}

function computeColors(hex: string): Color[] {
  return [
    getColorObject(tinycolor(hex).lighten(52), '50'),
    getColorObject(tinycolor(hex).lighten(37), '100'),
    getColorObject(tinycolor(hex).lighten(26), '200'),
    getColorObject(tinycolor(hex).lighten(12), '300'),
    getColorObject(tinycolor(hex).lighten(6), '400'),
    getColorObject(tinycolor(hex), '500'),
    getColorObject(tinycolor(hex).darken(6), '600'),
    getColorObject(tinycolor(hex).darken(12), '700'),
    getColorObject(tinycolor(hex).darken(18), '800'),
    getColorObject(tinycolor(hex).darken(24), '900'),
    getColorObject(tinycolor(hex).lighten(50).saturate(30), 'A100'),
    getColorObject(tinycolor(hex).lighten(30).saturate(30), 'A200'),
    getColorObject(tinycolor(hex).lighten(10).saturate(15), 'A400'),
    getColorObject(tinycolor(hex).lighten(5).saturate(5), 'A700'),
  ];
}

function getColorObject(value, name): Color {
  const c = tinycolor(value);
  return {
    name: name,
    hex: c.toHexString(),
    darkContrast: c.isLight(),
  };
}
