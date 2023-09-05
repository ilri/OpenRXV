import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-plugins',
  templateUrl: './plugins.component.html',
  styleUrls: ['./plugins.component.scss'],
})
export class PluginsComponent implements OnInit {
  plugins = [];
  pluginsForms = {};
  index_name: string;
  constructor(
    private settingsService: SettingsService,
    private activeRoute: ActivatedRoute,
    ) {}

  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    this.plugins = await this.settingsService.readPluginsSettings(this.index_name);
  }

  onEdited(event, name) {
    this.pluginsForms[name] = event;
  }

  async save() {
    const final = Object.values(this.pluginsForms)
      .filter((data: any) => data.active)
      .filter((data: any) => data.form.valid);
    await this.settingsService.writePluginsSettings(
      final.map((data: any) => {
        const obj = {};
        obj['name'] = data.name;
        obj['value'] = data.form.value;
        return obj;
      }),
      this.index_name
    );
  }
}
