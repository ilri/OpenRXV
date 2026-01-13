import { Component, OnInit, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { moveItemInArray, CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardTitle } from '@angular/material/card';

import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-sort',
    templateUrl: './sort.component.html',
    styleUrls: ['./sort.component.scss'],
    imports: [
        MatDialogTitle,
        MatIcon,
        MatDialogContent,
        CdkDropList,
        MatCard,
        CdkDrag,
        MatCardTitle,
        MatDialogActions,
        MatButton
    ]
})
export class SortComponent implements OnInit {
  dialogRef = inject<MatDialogRef<SortComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);

  sortedItems = [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    this.sortedItems = [].concat(this.data);
  }

  submit() {
    this.dialogRef.close(this.sortedItems);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.sortedItems, event.previousIndex, event.currentIndex);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
