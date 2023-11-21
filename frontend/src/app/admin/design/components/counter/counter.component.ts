import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';
import { isEmpty } from 'ramda';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-counter',
  templateUrl: './counter.component.html',
  styleUrls: ['./counter.component.scss'],
})
export class CounterComponent implements OnInit {
  @Output() edited: EventEmitter<any> = new EventEmitter();
  @Output() onDelete: EventEmitter<boolean> = new EventEmitter();

  form_data = [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'source',
      label: 'Data Source',
      type: 'metadata',
      required: true,
    },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      items: [
        { name: 'Count of distinct values', value: 'cardinality' },
        { name: 'Sum of numeric values', value: 'sum' },
        { name: 'Average of numeric values', value: 'avg' },
      ],
      required: true,
    },
    {
      name: 'description',
      label: 'Tour description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'filter',
      label: 'Value to filter the counter on',
      type: 'text',
      required: false,
    },
    {
      name: 'percentageFromTotal',
      label: 'Show percentage of total',
      type: 'check',
      required: false,
    },
  ];

  @Input() configs;

  delete() {
    this.onDelete.emit(true);
  }

  controls = [];
  constructor(
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (!this.configs.componentConfigs.source) this.openDialog();
  }

  openDialog(): void {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    const dialogRef = this.dialog.open(FormDialogComponent, {
      width: '456px',
      data: {
        dashboard_name,
        form_data: this.form_data,
        configs: this.configs,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.edited.emit(result);
      if (!result && isEmpty(this.configs.componentConfigs))
        this.onDelete.emit(!result);
    });
  }
}
