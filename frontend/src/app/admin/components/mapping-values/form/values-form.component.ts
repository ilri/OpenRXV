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
import { ValuesService } from 'src/app/admin/services/values.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-values-form',
  templateUrl: './values-form.component.html',
  styleUrls: ['./values-form.component.scss'],
})
export class ValuesForm implements OnInit {
  form: FormGroup = new FormGroup({
    find: new FormControl(''),
    replace: new FormControl(''),
  });

  async submit() {
    if (this.form.valid && this.data == null)
      this.dialogRef.close(await this.userService.post(this.form.value));
    else if (this.form.valid && this.data)
      this.dialogRef.close(
        await this.userService.put(this.data.id, this.form.value),
      );
  }

  constructor(
    public dialogRef: MatDialogRef<ValuesForm>,
    private userService: ValuesService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit(): void {
    if (this.data) {
      const temp = this.data;
      delete temp.created_at;
      // delete temp.id
      this.form.setValue(this.data);
    }
  }

  onNoClick(e): void {
    e.preventDefault();
    this.dialogRef.close();
  }
}
