import { Injectable } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root',
})
export class NoSapceService {
  static cannotContainSpace(control: AbstractControl): ValidationErrors | null {
    if ((control.value as string).indexOf(' ') >= 0) {
      return { cannotContainSpace: true };
    }
    return null;
  }
  static lowercaseValidator(c: FormControl) {
    let hasUpper = /[A-Z]/.test(c.value);

    if (hasUpper) {
      return { lowercase: true };
    } else {
      return null;
    }
  }
  constructor() {}
}
