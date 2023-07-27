import { Component, OnInit, Input } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  form: UntypedFormGroup = new UntypedFormGroup({
    email: new UntypedFormControl(''),
    password: new UntypedFormControl(''),
    submit: new UntypedFormControl(''),
  });
  constructor(private auth: AuthService, private router: Router) {}

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
