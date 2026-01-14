import { Component, OnInit, inject } from '@angular/core';
import { GeneralConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { ActivatedRoute } from '@angular/router';
import { DynamicComponent } from '../dashboard/components/dynamic/dynamic.component';

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
  imports: [DynamicComponent],
})
export class FiltersComponent implements OnInit {
  private settings = inject(SettingsService);
  private activeRoute = inject(ActivatedRoute);

  filters: GeneralConfigs[];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  async ngOnInit() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const { filters } = await this.settings.readExplorerSettings(
      dashboard_name ? dashboard_name : undefined,
    );
    this.filters = filters;
  }
}
