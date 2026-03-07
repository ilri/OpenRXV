import { Component, OnInit, Input, inject } from '@angular/core';
import {
  UntypedFormGroup,
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { MatButton } from '@angular/material/button';

import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
  ],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  form: UntypedFormGroup = new UntypedFormGroup({
    email: new UntypedFormControl(''),
    password: new UntypedFormControl(''),
    submit: new UntypedFormControl(''),
  });

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {}

  async submit() {
    if (this.form.valid) {
      try {
        const access_token = await this.auth.login(this.form.value);

        if (access_token) this.router.navigate(['admin']);
        else this.error = 'Username or password is wrong';
      } catch (e) {
        if (e.status == 401) this.error = 'Username or password is wrong';
        else this.error = e.statusText;
      }

      //this.submitEM.emit(this.form.value);
    }
  }
  @Input() error: string | null;
}
