import { Component, OnInit } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  UntypedFormArray,
} from '@angular/forms';
import { SettingsService } from '../services/settings.service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-appearance',
  templateUrl: './appearance.component.html',
  styleUrls: ['./appearance.component.scss'],
})
export class AppearanceComponent implements OnInit {
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
  ) {
  }
  src(value) {
    return environment.api + '/' + value;
  }
  async ngOnInit() {
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    const appearance = await this.settingsService.readAppearanceSettings(
      dashboard_name,
    );
    this.appearance = appearance;
    this.form.patchValue(appearance);
    this.primary_color = appearance.primary_color;
    this.secondary_color = appearance.secondary_color;
    this.logo = appearance.logo;
    this.favIcon = appearance.favIcon;
    await appearance.chartColors.map((a) => {
      this.colors.push(new UntypedFormControl(a));
    });
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
    const dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    this.form.controls.logo.setValue(this.logo);
    this.form.controls.favIcon.setValue(this.favIcon);
    if (this.form.valid)
      await this.settingsService.saveAppearanceSettings(
        dashboard_name,
        this.form.value,
      );
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
}
