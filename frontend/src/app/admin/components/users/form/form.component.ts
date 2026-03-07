import { Component, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import {
  UntypedFormGroup,
  UntypedFormControl,
  Validators,
  AsyncValidatorFn,
  AbstractControl,
  ValidationErrors,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { UsersService } from 'src/app/admin/services/users.service';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';

export function existValidator(usersService: UsersService): AsyncValidatorFn {
  if (usersService)
    return (
      control: AbstractControl,
    ):
      | Promise<ValidationErrors | null>
      | Observable<ValidationErrors | null> => {
      return usersService.validateUsers({ email: control.value });
    };
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    MatDialogTitle,
    FormsModule,
    ReactiveFormsModule,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatLabel,
    MatSelect,
    MatOption,
    MatDialogActions,
    MatButton,
    MatIcon,
  ],
})
export class FormComponent implements OnInit {
  dialogRef = inject<MatDialogRef<FormComponent>>(MatDialogRef);
  private userService = inject(UsersService);
  data = inject(MAT_DIALOG_DATA);
  private toastr = inject(ToastrService);
  private spinner = inject(NgxSpinnerService);

  form: UntypedFormGroup = new UntypedFormGroup({
    name: new UntypedFormControl(''),
    email: new UntypedFormControl(
      null,
      [Validators.email],
      [existValidator(this.userService)],
    ),
    role: new UntypedFormControl(''),
    password: new UntypedFormControl(''),
  });
  get email() {
    return this.form.get('email');
  }
  async submit() {
    if (!this.form.valid) {
      this.toastr.error('You have some errors. Please check the form.');
      return;
    }
    await this.spinner.show();
    if (this.data == null)
      this.dialogRef.close(await this.userService.PostUser(this.form.value));
    else if (this.data)
      this.dialogRef.close(
        await this.userService.updateUser(this.data.id, this.form.value),
      );
    this.toastr.success('User saved successfully');
    await this.spinner.hide();
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {
    if (this.data) {
      this.form.removeControl('email');
      this.form.registerControl(
        'email',
        new UntypedFormControl(null, [Validators.email]),
      ); // [existValidator(!this.data ? this.userService : null)]
      const temp = this.data;
      temp['password'] = '';
      delete temp.created_at;
      this.form.setValue(this.data);
    }
  }

  onNoClick(e): void {
    e.preventDefault();
    this.dialogRef.close();
  }
}
