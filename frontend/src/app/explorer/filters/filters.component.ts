import { Component, OnInit } from '@angular/core';
import { GeneralConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { SettingsService } from 'src/app/admin/services/settings.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent implements OnInit {
  filters: GeneralConfigs[];
  constructor(
    private settings: SettingsService,
    private activeRoute: ActivatedRoute,
  ) {}

  async ngOnInit() {
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    const { filters } = await this.settings.readExplorerSettings(
      dashboard_name ? dashboard_name : undefined,
    );
    this.filters = filters;
  }
}
