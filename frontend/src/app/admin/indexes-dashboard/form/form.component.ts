import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NoSapceService } from '../../components/validations/no-sapce.service';
import { SettingsService } from '../../services/settings.service';
import * as dayjs from 'dayjs';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormDashboardsComponent implements OnInit {
  form: any;
  indexes: any;
  async submit() {
    if (this.form.valid && this.data.event == 'New') {
      const response = await this.settingsService.saveDashboardsSettings(
        this.form.value,
        true,
      );
      if (response.success === true) {
        this.dialogRef.close(true);
        this.toastr.success('Dashboard saved successfully');
      } else {
        this.toastr.error(response?.message ? response.message : 'Oops! something went wrong', 'Save dashboard failed');
      }
    } else if (this.form.valid && this.data.event == 'Edit') {
      const dashboards = await this.settingsService.readDashboardsSettings();
      const newDashboardsArray = dashboards.map((obj) => {
        if (obj.id === this.data.body[0].id) {
          return {
            ...obj,
            name: this.form.value.name,
            description: this.form.value.description,
            index: this.form.value.index,
            created_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
          };
        }
        return obj;
      });
      const response = await this.settingsService.saveDashboardsSettings(
        newDashboardsArray,
        false,
      );
      if (response.success === true) {
        this.dialogRef.close(true);
        this.toastr.success('Dashboard saved successfully');
      } else {
        this.toastr.error(response?.message ? response.message : 'Oops! something went wrong', 'Save dashboard failed');
      }
    }
  }
  onNoClick(e): void {
    e.preventDefault();
    this.dialogRef.close();
  }
  constructor(
    public dialogRef: MatDialogRef<FormDashboardsComponent>,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService,
  ) {}
  populateForm(data = { name: '', description: '', index: '', isEdit: false }) {
    this.form = this.fb.group({
      name: [
        {
          value: data.name,
          disabled: data.isEdit
        },
        [
          Validators.required,
          NoSapceService.cannotContainSpace,
          NoSapceService.lowercaseValidator,
        ],
      ],
      index: [data.index],
      description: [data.description],
    });
  }
  async ngOnInit() {
    this.indexes = await this.settingsService.readIndexesSettings();
    if (this.data.event == 'Edit') {
      const data = {
        name: this.data.body[0].name,
        index: this.data.body[0].index,
        description: this.data.body[0].description,
        isEdit: true,
      };
      this.populateForm(data);
    } else {
      const data = { name: '', description: '', index: '', isEdit: false };
      this.populateForm(data);
    }
  }
}
