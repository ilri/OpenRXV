import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ValuesService } from 'src/app/admin/services/values.service';

@Component({
  selector: 'app-values-form',
  templateUrl: './values-form.component.html',
  styleUrls: ['./values-form.component.scss'],
})
export class ValuesForm implements OnInit {
  form: UntypedFormGroup = new UntypedFormGroup({
    find: new UntypedFormControl(''),
    replace: new UntypedFormControl(''),
    metadataField: new UntypedFormControl(''),
  });

  async submit(index_name) {
    if (!this.form.valid) {
      this.toastr.error('You have some errors. Please check the form.');
      return;
    }
    await this.spinner.show();
    if (this.data == null || !this.data?.find) {
      const response = await this.valuesService.post(
        this.form.value,
        index_name,
      );
      if (response.success === true) {
        this.dialogRef.close(true);
        this.toastr.success('Value mapping saved successfully');
      } else {
        this.toastr.error(
          response?.message ? response.message : 'Oops! something went wrong',
          'Save Value mapping failed',
        );
      }
    } else if (this.data) {
      const response = await this.valuesService.put(
        this.data.id,
        this.form.value,
        index_name,
      );
      if (response.success === true) {
        this.dialogRef.close(true);
        this.toastr.success('Value mapping saved successfully');
      } else {
        this.toastr.error(
          response?.message ? response.message : 'Oops! something went wrong',
          'Save Value mapping failed',
        );
      }
    }
    await this.spinner.hide();
  }

  constructor(
    public dialogRef: MatDialogRef<ValuesForm>,
    private valuesService: ValuesService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      if (!this.data?.metadataField) {
        this.data.metadataField = null;
      }
      if (this.data?.find) {
        this.form.setValue({
          find: this.data.find,
          replace: this.data.replace,
          metadataField: this.data.metadataField,
        });
      }
    }
  }

  onNoClick(e): void {
    e.preventDefault();
    this.dialogRef.close();
  }
}
