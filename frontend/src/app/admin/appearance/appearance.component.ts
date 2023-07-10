import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray } from '@angular/forms';
import { SettingsService } from '../services/settings.service';
import { environment } from 'src/environments/environment';

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
  form: FormGroup = new FormGroup({
    primary_color: new FormControl(this.primary_color),
    secondary_color: new FormControl(this.secondary_color),
    website_name: new FormControl(''),
    logo: new FormControl(''),
    favIcon: new FormControl(''),
    tracking_code: new FormControl(''),
    google_maps_api_key: new FormControl(''),
    description: new FormControl(''),
    chartColors: new FormArray([]),
  });
  constructor(private settingsService: SettingsService) {}
  src(value) {
    return environment.api + '/' + value;
  }
  async ngOnInit() {
    const appearance = await this.settingsService.readAppearanceSettings();
    this.appearance = appearance;
    this.form.patchValue(appearance);
    this.primary_color = appearance.primary_color;
    this.secondary_color = appearance.secondary_color;
    this.logo = appearance.logo;
    this.favIcon = appearance.favIcon;
    await appearance.chartColors.map((a) => {
      this.colors.push(new FormControl(a));
    });
  }
  colorPickerClose(event, element) {
    this.form.get(element).setValue(event);
  }
  addColor() {
    this.colors.push(new FormControl(''));
  }
  get colors(): FormArray {
    return this.form.get('chartColors') as FormArray;
  }

  async save() {
    this.form.controls.logo.setValue(this.logo);
    this.form.controls.favIcon.setValue(this.favIcon);
    if (this.form.valid)
      await this.settingsService.saveAppearanceSettings(this.form.value);
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
