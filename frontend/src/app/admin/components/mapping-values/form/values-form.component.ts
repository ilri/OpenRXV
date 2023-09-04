import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
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
    if (this.form.valid && (this.data == null || !this.data?.find))
      this.dialogRef.close(await this.valuesService.post(this.form.value, index_name));
    else if (this.form.valid && this.data)
      this.dialogRef.close(
        await this.valuesService.put(this.data.id, this.form.value, index_name),
      );
  }

  constructor(
    public dialogRef: MatDialogRef<ValuesForm>,
    private valuesService: ValuesService,
    @Inject(MAT_DIALOG_DATA) public data: any,
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
