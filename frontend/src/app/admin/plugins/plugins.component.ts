import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings.service';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../common.service';

@Component({
  selector: 'app-plugins',
  templateUrl: './plugins.component.html',
  styleUrls: ['./plugins.component.scss'],
})

export class PluginsComponent implements OnInit {
  plugins = [];
  pluginsForms = {};
  index_name: string;
  exportLink: string;
  constructor(
    private settingsService: SettingsService,
    private activeRoute: ActivatedRoute,
    private toastr: ToastrService,
    private commonService: CommonService,
    ) {}

  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    this.plugins = await this.settingsService.readPluginsSettings(this.index_name);
    this.exportLink = 'data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(this.plugins));
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
    const plugins = await this.settingsService.readPluginsSettings(this.index_name);
    this.exportLink = 'data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(plugins));
  }

  async importJSON(event) {
    const data: any = await this.commonService.importJSON(event);
    const importStatus = {
      failed: [],
      success: [],
    };

    for (let i = 0; i < data.length; i++) {
      const importedItem = (data[i] as any);
      let found = false;
      this.plugins = this.plugins.map((plugin) => {
        if (plugin.name === importedItem.name) {
          found = true;
          importStatus.success.push(importedItem.name);
          plugin.importedValues = importedItem.values;
        }
        return plugin;
      });
      if (!found) {
        const pluginName = importedItem?.name !== '' ? importedItem.name : 'Plugin #' + (i + 1);
        const message = pluginName + ', failed to import with error: Unknown plugin';
        importStatus.failed.push(message);
      }
    }

    const message = this.commonService.importJSONResponseMessage(importStatus, data.length, 'Plugin(s)');
    if (message.type === 'success') {
      this.toastr.success(message.message, null, {enableHtml: true});
    } else if (message.type === 'warning') {
      this.toastr.warning(message.message, null, {enableHtml: true});
    } else {
      this.toastr.error(message.message, null, {enableHtml: true});
    }
  }
}
