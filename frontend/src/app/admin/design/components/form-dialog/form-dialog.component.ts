import { Component, OnInit, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MetadataService } from 'src/app/admin/services/metadata.service';

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss']
})
export class FormDialogComponent implements OnInit {
  controls = [];
  form: FormGroup = new FormGroup({
    icon: new FormControl('')
  });
  pre: any;
  formControls = [];
  metadata = []

  constructor(
    private metadataService: MetadataService,
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(value): void {
    this.dialogRef.close(false)


  }
  submit(value) {
    let names_exist: Array<string> = this.data.form_data.map(d => d.name)
    Object.keys(this.form.controls).forEach(key => {
      if (names_exist.indexOf(key) == -1)
        this.form.removeControl(key)
    })
    if (this.form.valid)
      this.dialogRef.close(value);
  }
  async ngOnInit() {
    let FormGroupControls: any = {};
    this.data.form_data.forEach(element => {
      if (this.data.configs.componentConfigs[element.name] != null)
        FormGroupControls[element.name] = new FormControl(element.name == 'source' ? this.data.configs.componentConfigs[element.name].replace('.keyword', '') : this.data.configs.componentConfigs[element.name])
      else if (this.data.configs[element.name])
        FormGroupControls[element.name] = new FormControl(this.data.configs[element.name])
      else if (this.data.configs[element.name])
        FormGroupControls[element.name] = new FormControl(this.data.configs[element.name])
      else
        FormGroupControls[element.name] = new FormControl(null);
    });
    this.form = new FormGroup(FormGroupControls);
    this.metadata = await this.metadataService.get()
    this.formControls = this.data.form_data;
    this.pre = this.form.value
  }

}
