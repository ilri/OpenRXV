import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  Validators,
  AsyncValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { UsersService } from 'src/app/admin/services/users.service';
import { Observable } from 'rxjs';
import { ConfirmationComponent } from '../../confirmation/confirmation.component';

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
})
export class FormComponent implements OnInit {
  form: FormGroup = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(
      null,
      [Validators.email],
      [existValidator(this.userService)],
    ),
    role: new FormControl(''),
    password: new FormControl(''),
  });
  get email() {
    return this.form.get('email');
  }
  async submit() {
    if (this.form.valid && this.data == null)
      this.dialogRef.close(await this.userService.PostUser(this.form.value));
    else if (this.form.valid && this.data)
      this.dialogRef.close(
        await this.userService.updateUser(this.data.id, this.form.value),
      );
  }

  constructor(
    public dialogRef: MatDialogRef<FormComponent>,
    private userService: UsersService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      this.form.removeControl('email');
      this.form.registerControl(
        'email',
        new FormControl(null, [Validators.email]),
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
