import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NoSapceService } from '../../components/validations/no-sapce.service';
import { SettingsService } from '../../services/settings.service';

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
      this.dialogRef.close(
        await this.settingsService.saveDashboardsSettings(
          this.form.value,
          true,
        ),
      );
      console.log('this.form.value', this.form.value);
    } else if (this.form.valid && this.data.event == 'Edit') {
      let dashboards = await this.settingsService.readDashboardsSettings();
      const newDashboardsArray = dashboards.map((obj) => {
        if (obj.id === this.data.body[0].id) {
          return {
            ...obj,
            name: this.form.value.name,
            description: this.form.value.description,
            index: this.form.value.index,
            created_at: new Date().toLocaleString(),
          };
        }
        return obj;
      });
      const response = await this.settingsService.saveDashboardsSettings(
        newDashboardsArray,
        false,
      );
      if (response.success === true) {
        this.dialogRef.close();
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
  populateForm(data) {
    this.form = this.fb.group({
      name: [
        data.name,
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
      };
      await this.populateForm(data);
    } else {
      const data = { name: '', description: '', index: '' };
      await this.populateForm(data);
    }
  }
}
