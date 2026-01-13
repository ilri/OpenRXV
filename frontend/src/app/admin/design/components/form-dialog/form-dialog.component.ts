import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MetadataService } from 'src/app/admin/services/metadata.service';
import { ActivatedRoute } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MainListComponent } from '../main-list/main-list.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';


@Component({
    selector: 'app-form-dialog',
    templateUrl: './form-dialog.component.html',
    styleUrls: ['./form-dialog.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        FormsModule,
        ReactiveFormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        NgSelectModule,
        MatIcon,
        MatCheckbox,
        MatTooltip,
        MainListComponent,
        MatDialogActions,
        MatButton
    ]
})
export class FormDialogComponent implements OnInit {
  private metadataService = inject(MetadataService);
  dialogRef = inject<MatDialogRef<FormDialogComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);
  private activeRoute = inject(ActivatedRoute);

  controls = [];
  form: UntypedFormGroup = new UntypedFormGroup({
    icon: new UntypedFormControl(''),
  });
  pre: any;
  formControls = [];
  metadata = [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  onNoClick(value): void {
    this.dialogRef.close(false);
  }
  submit(value) {
    const names_exist: Array<string> = this.data.form_data.map((d) => d.name);
    Object.keys(this.form.controls).forEach((key) => {
      if (names_exist.indexOf(key) == -1) this.form.removeControl(key);
    });
    if (this.form.valid) this.dialogRef.close(value);
  }
  dashbard_name;
  async ngOnInit() {
    this.dashbard_name = this.data.dashboard_name;
    const FormGroupControls: any = {};
    this.data.form_data.forEach((element) => {
      if (this.data.configs.componentConfigs[element.name] != null)
        FormGroupControls[element.name] = new UntypedFormControl(
          element.name == 'source'
            ? this.data.configs.componentConfigs[element.name].replace(
                '.keyword',
                '',
              )
            : this.data.configs.componentConfigs[element.name],
        );
      else if (this.data.configs[element.name])
        FormGroupControls[element.name] = new UntypedFormControl(
          this.data.configs[element.name],
        );
      else if (this.data.configs[element.name])
        FormGroupControls[element.name] = new UntypedFormControl(
          this.data.configs[element.name],
        );
      else FormGroupControls[element.name] = new UntypedFormControl(null);
    });
    this.form = new UntypedFormGroup(FormGroupControls);
    this.metadata = await this.metadataService.get(this.dashbard_name, null);
    this.formControls = this.data.form_data;
    this.pre = this.form.value;
  }
}
