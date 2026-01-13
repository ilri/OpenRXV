import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-snack',
    templateUrl: './snack.component.html',
    styleUrls: ['./snack.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatIcon]
})
export class SnackComponent {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() set error(e: HttpErrorResponse) {
    this.messageFromStatus(e);
  }
  message: string;
  icon: string;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  private messageFromStatus({ status }: HttpErrorResponse): void {
    if (status === 400 || status === 404) {
      this.buildMessage(
        'We can not reach the server now',
        'settings_input_antenna',
      );
    } else if (status === 500) {
      this.buildMessage('Something went wrong', 'error_outline');
    } else {
      this.buildMessage('Unknown issue happened', 'report');
    }
  }

  private buildMessage(s: string, i: string): void {
    this.message = `${s}, please try again later`;
    this.icon = i;
    this.cdr.detectChanges();
  }
}
