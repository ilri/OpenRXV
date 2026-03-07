import { Component, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import {
  MatFormField,
  MatLabel,
  MatSuffix,
} from '@angular/material/form-field';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatButton,
    MatSuffix,
    MatIcon,
    MatDialogActions,
    MatDialogClose,
  ],
})
export class ShareComponent implements OnInit {
  dialogRef = inject<MatDialogRef<ShareComponent>>(MatDialogRef);
  private clipboard = inject(Clipboard);
  data = inject<{
    link: string;
  }>(MAT_DIALOG_DATA);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngOnInit(): void {}

  copy(link) {
    this.clipboard.copy(link);
  }
}
