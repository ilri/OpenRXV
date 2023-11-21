import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
})
export class FilterComponent implements OnInit {
  @Output() edited: EventEmitter<any> = new EventEmitter();
  @Output() onDelete: EventEmitter<boolean> = new EventEmitter();
  dialogRef: MatDialogRef<any>;
  form_data = [];
  icon: string;
  iconText: string;
  pre: any;
  baseform = [
    {
      name: 'component',
      label: 'Item Type',
      type: 'select',
      items: [
        { name: 'Label', value: 'LabelComponent' },
        { name: 'Select', value: 'SelectComponent' },
        { name: 'Search', value: 'SearchComponent' },
        { name: 'Range', value: 'RangeComponent' },
        { name: 'Date Range', value: 'DateRangeComponent' },
      ],
      required: true,
      onChange: (event) => {
        this.pre = event;
        this.setFormDataOprions(event.value);
        this.dialogRef.close(true);
        this.openDialog();
      },
    },
  ];

  setFormDataOprions(value) {
    switch (value) {
      case 'SearchComponent':
        this.form_data = [
          ...this.baseform,
          ...[
            {
              name: 'placeholder',
              label: 'Placeholder',
              type: 'text',
              required: true,
            },
            {
              name: 'is_advanced',
              label: 'Advanced search',
              type: 'checkbox',
              required: false,
            },
          ],
        ];
        break;
      case 'LabelComponent':
        this.form_data = [
          ...this.baseform,
          ...[
            {
              name: 'text',
              label: 'Text',
              type: 'textarea',
              required: true,
            },
            {
              name: 'border',
              label: 'Border under label',
              type: 'check',
              required: true,
            },
            {
              name: 'description',
              label: 'Text',
              type: 'textarea',
              required: false,
            },
          ],
        ];
        break;
      case 'RangeComponent':
        this.form_data = [
          ...this.baseform,
          ...[
            {
              name: 'source',
              label: 'Data Source',
              type: 'metadata',
              required: true,
            },
            {
              name: 'placeholder',
              label: 'Placeholder',
              type: 'text',
              required: true,
            },
          ],
        ];
        break;
      case 'DateRangeComponent':
        this.form_data = [
          ...this.baseform,
          ...[
            {
              name: 'source',
              label: 'Data Source',
              type: 'metadata',
              required: true,
            },
            {
              name: 'placeholder',
              label: 'Placeholder',
              type: 'text',
              required: true,
            },
          ],
        ];
        break;
      case 'SelectComponent':
        this.form_data = [
          ...this.baseform,
          ...[
            {
              name: 'source',
              label: 'Data Source',
              type: 'metadata',
              required: true,
            },
            {
              name: 'placeholder',
              label: 'Placeholder',
              type: 'text',
              required: true,
            },
          ],
        ];
        break;
      default:
        this.form_data = this.baseform;
        break;
    }
  }

  @Input() configs;

  delete() {
    this.onDelete.emit(true);
  }

  controls = [];
  constructor(
    public dialog: MatDialog,
    private activeRoute: ActivatedRoute,
  ) {}
  setIcon() {
    const icons = {
      SelectComponent: 'list',
      LabelComponent: 'label',
      SearchComponent: 'search',
      RangeComponent: 'settings_ethernet',
      DateRangeComponent: 'date_range',
    };
    const iconsTexts = {
      SelectComponent: 'Select',
      LabelComponent: 'Label',
      SearchComponent: 'Search',
      RangeComponent: 'Range',
      DateRangeComponent: 'Date Range',
    };
    this.icon = icons[this.configs.component];
    this.iconText = iconsTexts[this.configs.component];
  }
  ngOnInit(): void {
    this.form_data = this.baseform;
    if (!this.configs.component) {
      this.openDialog();
    } else {
      this.setFormDataOprions(this.configs.component);
      this.setIcon();
    }
  }
  editFilter: any = false;
  edit() {
    this.editFilter = Object.assign({}, this.configs);
    this.openDialog();
  }

  openDialog(): void {
    if (this.pre) {
      this.configs.component = this.pre.value;
    }
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    this.dialogRef = this.dialog.open(FormDialogComponent, {
      width: '456px',
      data: {
        dashboard_name,
        form_data: this.form_data,
        configs: this.configs,
      },
    });

    this.dialogRef.afterClosed().subscribe((result) => {
      if (result != true) {
        if (result && result != true) this.edited.emit(result);
        if (!result && !this.editFilter) this.delete();
        else if (this.editFilter != false && !result) {
          this.edited.emit({
            ...this.editFilter.componentConfigs,
            component: this.editFilter.component,
          });
        }
      }
    });
  }
}
