import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { NoSapceService } from '../../components/validations/no-sapce.service';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
})
export class FormIndexComponent implements OnInit {
  form: FormGroup = new FormGroup({});
  async submit() {
    if (this.form.valid && this.data.event == 'New') {
      const response = await this.settingsService.saveIndexesSettings(this.form.value, true, null);
      if (response.success === true) {
        this.dialogRef.close();
        this.toastr.success('Index saved successfully');
      } else {
        this.toastr.error(response?.message ? response.message : 'Oops! something went wrong', 'Save index failed');
      }
    } else if (this.form.valid && this.data.event == 'Edit') {
      const indexes = await this.settingsService.readIndexesSettings();
      const newIndexesArray = indexes.map((obj) => {
        if (obj.id === this.data.body[0].id) {
          return {
            ...obj,
            name: this.form.value.name,
            description: this.form.value.description,
            to_be_indexed: this.form.value.to_be_indexed,
            created_at: new Date().toLocaleString(),
          };
        }
        return obj;
      });
      const response = await this.settingsService.saveIndexesSettings(
        newIndexesArray,
        false,
        null,
      );
      if (response.success === true) {
        this.dialogRef.close();
        this.toastr.success('Index saved successfully');
      } else {
        this.toastr.error(response?.message ? response.message : 'Oops! something went wrong', 'Save index failed');
      }
    }
  }
  onNoClick(e): void {
    e.preventDefault();
    this.dialogRef.close();
  }
  constructor(
    public dialogRef: MatDialogRef<FormIndexComponent>,
    private fb: FormBuilder,
    private settingsService: SettingsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService,
  ) {}

  populateForm(data = { name: '', description: '', to_be_indexed: false }) {
    this.form = this.fb.group({
      name: [
        data.name,
        [
          Validators.required,
          NoSapceService.cannotContainSpace,
          NoSapceService.lowercaseValidator,
        ],
      ],
      to_be_indexed:[data.to_be_indexed],
      description: [data.description],
    });
  }
  async ngOnInit() {
    this.populateForm();
    if (this.data.event == 'Edit') {
      const data = {
        name: this.data.body[0].name,
        description: this.data.body[0].description,
        to_be_indexed: this.data.body[0].to_be_indexed,
      };
      await this.populateForm(data);
    } else {
      const data = { name: '', description: '', to_be_indexed: false };
      await this.populateForm(data);
    }
  }
}
