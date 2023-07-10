import { Component, OnInit } from '@angular/core';
import { GeneralConfigs } from 'src/app/explorer/configs/generalConfig.interface';
import { SettingsService } from 'src/app/admin/services/settings.service';
@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent implements OnInit {
  filters: GeneralConfigs[];
  constructor(private settings: SettingsService) {}

  async ngOnInit() {
    const { filters } = await this.settings.readExplorerSettings();
    this.filters = filters;
  }
}
