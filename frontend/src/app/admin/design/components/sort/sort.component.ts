import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { moveItemInArray, CdkDragDrop, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardTitle } from '@angular/material/card';

import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-sort',
    templateUrl: './sort.component.html',
    styleUrls: ['./sort.component.scss'],
    standalone: true,
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
],
})
export class SortComponent implements OnInit {
  sortedItems = [];
  constructor(
    public dialogRef: MatDialogRef<SortComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

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
