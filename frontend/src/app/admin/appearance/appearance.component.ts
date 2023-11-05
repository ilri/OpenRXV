import { Component, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  UntypedFormArray,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { SettingsService } from '../services/settings.service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../../common.service';

@Component({
  selector: 'app-appearance',
  templateUrl: './appearance.component.html',
  styleUrls: ['./appearance.component.scss'],
})
export class AppearanceComponent implements OnInit {
  dashboard_name: string;
  exportLink: string;
  primary_color = '';
  secondary_color = '';
  appearance;
  logo;
  favIcon;
  form: UntypedFormGroup = new UntypedFormGroup({
    primary_color: new UntypedFormControl(this.primary_color),
    secondary_color: new UntypedFormControl(this.secondary_color),
    website_name: new UntypedFormControl(''),
    logo: new UntypedFormControl(''),
    favIcon: new UntypedFormControl(''),
    tracking_code: new UntypedFormControl(''),
    show_tool_bar: new UntypedFormControl(false),
    show_side_nav: new UntypedFormControl(false),
    show_top_nav: new UntypedFormControl(false),
    google_maps_api_key: new UntypedFormControl(''),
    description: new UntypedFormControl(''),
    chartColors: new UntypedFormArray([]),
  });

  constructor(
    private settingsService: SettingsService,
    private activeRoute: ActivatedRoute,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private commonService: CommonService,
  ) {
  }
  src(value) {
    try {
      return new URL(value);
    } catch (e) {
      return environment.api + '/' + value;
    }
  }
  async ngOnInit() {
    const dashboard_name = this.dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const appearance = await this.settingsService.readAppearanceSettings(
      dashboard_name,
    );
    this.appearance = appearance;
    await this.populateForm(appearance);
    this.refreshExportLink(appearance);
  }

  async populateForm(appearance) {
    this.form.patchValue(appearance);
    this.primary_color = appearance.primary_color;
    this.secondary_color = appearance.secondary_color;
    this.logo = appearance.logo;
    this.favIcon = appearance.favIcon;
    this.colors.clear();
    await appearance.chartColors.map((a) => {
      this.colors.push(new UntypedFormControl(a));
    });
  }

  refreshExportLink(data) {
    const appearance = JSON.parse(JSON.stringify(data));
    if (data?.logo !== '' && data.logo != null) {
      appearance.logo = location.origin + environment.api + '/' + appearance.logo;
    }
    if (data?.favIcon !== '' && data.favIcon != null) {
      appearance.favIcon = location.origin + environment.api + '/' + appearance.favIcon;
    }
    this.exportLink = 'data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(appearance));
  }

  colorPickerClose(event, element) {
    this.form.get(element).setValue(event);
  }
  addColor() {
    this.colors.push(new UntypedFormControl(''));
  }
  get colors(): UntypedFormArray {
    return this.form.get('chartColors') as UntypedFormArray;
  }

  async save() {
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('dashboard_name');
    this.form.controls.logo.setValue(this.logo);
    this.form.controls.favIcon.setValue(this.favIcon);
    if (this.form.valid) {
      await this.spinner.show();
      await this.settingsService.saveAppearanceSettings(
          dashboard_name,
          this.form.value,
      );

      const appearance = await this.settingsService.readAppearanceSettings(
          dashboard_name,
      );
      this.refreshExportLink(appearance);
      this.toastr.success('Saved successfully');
      await this.spinner.hide();
    }
  }

  logoChange(event) {
    this.upload(event.target.files[0]);
  }
  favIconChange(event) {
    this.uploadFavIcon(event.target.files[0]);
  }
  async uploadFavIcon(file: File) {
    this.favIcon = await this.settingsService.upload(file);
    this.form.controls.favIcon.setValue(this.favIcon);
  }
  async upload(file: File) {
    this.logo = await this.settingsService.upload(file);
    this.form.controls.logo.setValue(this.logo);
  }
  deleteColor(index) {
    this.colors.removeAt(index);
  }

  async importJSON(event) {
    await this.spinner.show();
    const importedItem: any = await this.commonService.importJSON(event);
    const importStatus = {
      failed: [],
      success: [],
    };

    const appearance = {
      primary_color: importedItem?.primary_color,
      secondary_color: importedItem?.secondary_color,
      website_name: importedItem?.website_name,
      logo: importedItem?.logo,
      favIcon: importedItem?.favIcon,
      tracking_code: importedItem?.tracking_code,
      show_tool_bar: importedItem?.show_tool_bar,
      show_side_nav: importedItem?.show_side_nav,
      show_top_nav: importedItem?.show_top_nav,
      google_maps_api_key: importedItem?.google_maps_api_key,
      description: importedItem?.description,
      chartColors: importedItem?.chartColors,
    }
    await this.populateForm(appearance);
    importStatus.success.push(importedItem);

    await this.spinner.hide();
    const message = this.commonService.importJSONResponseMessage(importStatus, 1, 'Appearance');
    if (message.type === 'success') {
      this.toastr.success(message.message, null, {enableHtml: true});
    } else if (message.type === 'warning') {
      this.toastr.warning(message.message, null, {enableHtml: true});
    } else {
      this.toastr.error(message.message, null, {enableHtml: true});
    }
  }
}
