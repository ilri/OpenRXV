import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { icons_list } from './icons';
import { ActivatedRoute } from '@angular/router';
import { MatCard, MatCardTitle, MatCardContent } from '@angular/material/card';
import { NgClass } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import {
  CdkDragDrop,
  moveItemInArray,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-structure',
  templateUrl: './structure.component.html',
  styleUrls: ['./structure.component.scss'],
  imports: [
    MatIconButton,
    MatIcon,
    NgClass,
    MatCard,
    MatButton,
    MatCardTitle,
    MatCardContent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
})
export class StructureComponent implements OnInit {
  dialog = inject(MatDialog);
  private activeRoute = inject(ActivatedRoute);

  @Output() edited: EventEmitter<any> = new EventEmitter();
  @Output() onAdd: EventEmitter<any> = new EventEmitter();
  @Output() onDelete: EventEmitter<boolean> = new EventEmitter();
  @Output() rowDeleted: EventEmitter<boolean> = new EventEmitter();
  class_names = [];
  currentIndex;
  options = [
    { name: 'Pie Chart', value: 'PieComponent', icon: 'pie_chart' },
    { name: 'Bars Chart', value: 'BarComponent', icon: 'bar_chart' },
    { name: 'Line', value: 'LineComponent', icon: 'bar_chart' },
    { name: 'Word Cloud', value: 'WordcloudComponent', icon: 'filter_drama' },
    { name: 'Sunburst Chart', value: 'SunburstComponent', icon: 'pie_chart' },
    { name: 'World Map', value: 'MapComponent', icon: 'map' },
    { name: 'Google Map', value: 'GoogleMapsComponent', icon: 'map' },
    { name: 'List', value: 'ListComponent', icon: 'list' },
    { name: 'Main Items list', value: 'MainListComponent', icon: 'view_list' },
  ];
  metrics = [
    { name: 'Count', value: 'count' },
    { name: 'Sum', value: 'sum' },
    { name: 'Average', value: 'avg' },
    { name: 'Minimum', value: 'min' },
    { name: 'Maximum', value: 'max' },
    { name: 'Cardinality', value: 'cardinality' },
    { name: 'Value Count', value: 'value_count' },
    { name: 'Median Absolute Deviation', value: 'median_absolute_deviation' },
    { name: 'Percentiles', value: 'percentiles' },
    { name: 'Percentile Ranks', value: 'percentile_ranks' },
    { name: 'Stats', value: 'stats' },
    { name: 'Extended Stats', value: 'extended_stats' },
    { name: 'Matrix Stats', value: 'matrix_stats' },
  ];
  pre;
  baseform = [
    {
      name: 'component',
      label: 'Component type',
      type: 'select',
      items: this.options,
      onChange: (event) => {
        this.pre = event;
        this.setFormDataOptions(event.value);
        this.dialogRef.close();
        this.openDialog(this.currentIndex);
      },
      required: true,
    },
  ];
  dialogRef: MatDialogRef<any>;
  form_data = [];
  @Input() grid;
  @Input() gridRow;
  resizingIndex: number = -1;
  startX: number = 0;
  startWidthLeft: number = 0;
  startWidthRight: number = 0;
  containerWidth: number = 0;

  dialogReficons: MatDialogRef<any>;
  iconConfigs = {
    componentConfigs: {
      icon: 'pie_chart',
    },
  };
  iconsForm = [
    {
      name: 'icon',
      label: 'Select icon',
      icons: true,
      type: 'select',
      items: icons_list.map((d) => {
        return { name: d.name, value: d.name };
      }),
      onChange: (event) => {
        // this.pre = event;
      },
      required: true,
    },
  ];
  setFormDataOptions(value) {
    switch (value) {
      case 'MainListComponent':
        this.form_data = [
          ...this.baseform,
          ...[
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
            },
            {
              name: 'description',
              label: 'Tour description',
              type: 'textarea',
              required: true,
            },
            {
              name: 'size',
              label: 'Number of results',
              type: 'number',
              required: false,
            },
            {
              name: 'content',
              label: 'Details',
              type: 'content',
              required: true,
            },
          ],
        ];
        break;

      default:
        this.form_data = [
          ...this.baseform,
          ...[
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
            },
            {
              name: 'source',
              label: 'Data Source',
              type: 'multi-source',
              required: true,
            },
            {
              name: 'metric',
              label: 'Metric',
              type: 'select',
              items: this.metrics,
              onChange: (event) => {
                this.updateMetricField(event.value);
              },
              required: true,
            },
            {
              name: 'metric_field',
              label: 'Metric Field',
              type: 'metadata',
              required: false,
              hidden: true,
            },
            {
              name: 'allowFilterOnClick',
              label: 'Allow Filter on click',
              type: 'check',
              required: true,
            },
            {
              name: 'description',
              label: 'Tour description',
              type: 'textarea',
              required: true,
            },
          ],
        ];
        break;
    }

    if (value === 'PieComponent') {
      this.form_data.push({
        name: 'inner_size',
        label: 'Inner size',
        type: 'number',
        required: true,
      });
      this.form_data.push({
        name: 'data_labels',
        label: 'Show data labels',
        type: 'checkbox',
        required: false,
      });
      this.form_data.push({
        name: 'data_labels_count',
        label: 'Show data labels count',
        type: 'checkbox',
        required: false,
      });
      this.form_data.push({
        name: 'data_labels_percentage',
        label: 'Show data labels percentage',
        type: 'checkbox',
        required: false,
      });
    } else if (value === 'MapComponent') {
      this.form_data.push({
        name: 'map_type',
        label: 'Map type',
        type: 'select',
        items: [
          { name: 'Normal', value: 'normal' },
          { name: 'Map with pies', value: 'pie' },
        ],
        required: true,
      });
      this.form_data.push({
        name: 'data_labels',
        label: 'Show data labels',
        type: 'checkbox',
        required: false,
      });
      this.form_data.push({
        name: 'data_labels_count',
        label: 'Show data labels count',
        type: 'checkbox',
        required: false,
      });
    } else if (value === 'BarComponent') {
      this.form_data.push({
        name: 'direction',
        label: 'Direction',
        type: 'select',
        items: [
          { name: 'Vertical', value: 'vertical' },
          { name: 'Horizontal', value: 'horizontal' },
        ],
        required: true,
      });
      this.form_data.push({
        name: 'stacking',
        label: 'Stacking',
        type: 'select',
        items: [
          { name: 'Plain', value: 'plain' },
          { name: 'Grouped', value: 'group' },
          { name: 'Stacked', value: 'stack' },
        ],
        required: true,
      });
      this.form_data.push({
        name: 'data_labels_count',
        label: 'Show data labels count',
        type: 'checkbox',
        required: false,
      });
    } else if (value === 'LineComponent') {
      this.form_data.push({
        name: 'line_type',
        label: 'Line type',
        type: 'select',
        items: [
          { name: 'Line', value: 'line' },
          { name: 'Area', value: 'area' },
        ],
        required: true,
      });
    } else if (value === 'ListComponent') {
      this.form_data.push({
        name: 'hide_total',
        label: 'Hide total',
        type: 'checkbox',
        required: false,
      });
      this.form_data.push({
        name: 'hide_percentage',
        label: 'Hide percentage',
        type: 'checkbox',
        required: false,
      });
    }

    this.form_data.push({
      name: 'pre_filter',
      label: 'Pre-filter (JSON)',
      type: 'textarea',
      required: false,
    });
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  oldcomponent = [];

  ngOnInit(): void {
    this.grid.forEach((element, index) => {
      this.class_names[index] = element.class;
      this.oldcomponent[index] = element.component;
    });
    this.iconConfigs.componentConfigs.icon = this.grid[0]?.scroll?.icon || null;
  }

  addComponent(index) {
    if (this.grid.length < 4) {
      this.grid.splice(index + 1, 0, { class: 'col-md-3' });
      this.redistributeWidths();
      this.edited.emit({ result: this.grid, isFullGrid: true });
    }
  }

  redistributeWidths() {
    const count = this.grid.length;
    const baseWidth = Math.floor(12 / count);
    const extra = 12 % count;

    this.grid.forEach((element, i) => {
      const width = i < extra ? baseWidth + 1 : baseWidth;
      element.class = `col-md-${width} no-side-padding`;
      this.class_names[i] = element.class;
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.grid, event.previousIndex, event.currentIndex);
    this.grid.forEach((element, index) => {
      this.class_names[index] = element.class;
      this.oldcomponent[index] = element.component;
    });
    this.edited.emit({ result: this.grid, isFullGrid: true });
  }

  icon(component) {
    const filterd = this.options.filter((d) => d.value == component);
    if (filterd.length && filterd[0]) return filterd[0].icon;
  }

  word(component) {
    const filterd = this.options.filter((d) => d.value == component);
    if (filterd.length && filterd[0]) return filterd[0].name;
  }

  delete(index) {
    this.grid.splice(index, 1);
    if (this.grid.length === 0) {
      this.grid.push({ class: 'col-md-12' });
    } else {
      this.redistributeWidths();
    }
    this.edited.emit({ result: this.grid, isFullGrid: true });
  }

  onMouseDown(event: MouseEvent, index: number) {
    event.preventDefault();
    event.stopPropagation();
    if (index >= this.grid.length - 1) return;

    this.resizingIndex = index;
    this.startX = event.clientX;

    (event.target as HTMLElement).classList.add('resizing');

    const leftClass = this.grid[index].class || 'col-md-3';
    const leftMatch = leftClass.match(/col-md-(\d+)/);
    this.startWidthLeft = leftMatch ? parseInt(leftMatch[1], 10) : 3;

    const rightClass = this.grid[index + 1].class || 'col-md-3';
    const rightMatch = rightClass.match(/col-md-(\d+)/);
    this.startWidthRight = rightMatch ? parseInt(rightMatch[1], 10) : 3;

    const element = (event.target as HTMLElement).closest('.position-relative');

    if (element) {
      // containerWidth represents the pixel width of one bootstrap column
      this.containerWidth =
        (element as HTMLElement).offsetWidth / this.startWidthLeft;
    }

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent) => {
    if (this.resizingIndex === -1) return;

    const deltaX = event.clientX - this.startX;
    const deltaColumns = Math.round(deltaX / this.containerWidth);

    // Enforce min 3 columns per component
    let newWidthLeft = this.startWidthLeft + deltaColumns;
    let newWidthRight = this.startWidthRight - deltaColumns;

    if (newWidthLeft < 3) {
      newWidthLeft = 3;
      newWidthRight = this.startWidthLeft + this.startWidthRight - 3;
    } else if (newWidthRight < 3) {
      newWidthRight = 3;
      newWidthLeft = this.startWidthLeft + this.startWidthRight - 3;
    }

    const currentLeftMatch = (this.grid[this.resizingIndex].class || '').match(
      /col-md-(\d+)/,
    );
    const currentLeftWidth = currentLeftMatch
      ? parseInt(currentLeftMatch[1], 10)
      : 0;

    if (newWidthLeft !== currentLeftWidth) {
      this.grid[this.resizingIndex].class =
        `col-md-${newWidthLeft} no-side-padding`;
      this.class_names[this.resizingIndex] =
        this.grid[this.resizingIndex].class;

      this.grid[this.resizingIndex + 1].class =
        `col-md-${newWidthRight} no-side-padding`;
      this.class_names[this.resizingIndex + 1] =
        this.grid[this.resizingIndex + 1].class;
    }
  };

  onMouseUp = (event: MouseEvent) => {
    if (this.resizingIndex !== -1) {
      this.edited.emit({ result: this.grid, isFullGrid: true });
    }
    this.resizingIndex = -1;
    (event.target as HTMLElement).classList.remove('resizing');
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  rowDelete() {
    this.rowDeleted.emit(true);
  }

  setIcon() {
    this.dialogReficons = this.dialog.open(FormDialogComponent, {
      width: '456px',
      minHeight: '456px',
      data: { form_data: this.iconsForm, configs: this.iconConfigs },
    });
    this.dialogReficons.afterClosed().subscribe((result) => {
      if (result) {
        this.grid.forEach((element, index) => {
          if (index == 0) element['scroll'] = { icon: result.icon };
          else
            element['scroll'] = {
              linkedWith: this.grid[0].componentConfigs.id,
            };
        });
      }
    });
  }

  updateMetricField(value) {
    const metricField = this.form_data.find((d) => d.name == 'metric_field');
    if (metricField) {
      metricField.hidden = value == 'count';
      metricField.required = value != 'count';
    }
  }

  openDialog(index): void {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    if (this.pre) this.grid[index].component = this.pre.value;

    this.currentIndex = index;
    this.setFormDataOptions(this.grid[index].component);

    // Set initial hidden state for metric_field
    if (
      this.grid[index].componentConfigs &&
      this.grid[index].componentConfigs.metric
    ) {
      this.updateMetricField(this.grid[index].componentConfigs.metric);
    }

    this.dialogRef = this.dialog.open(FormDialogComponent, {
      width: '95vw',
      data: {
        dashboard_name,
        form_data: Object.create(this.form_data),
        configs: this.grid[index],
        index,
        gridRow: this.gridRow,
      },
    });

    this.dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (result.component == 'MainListComponent')
          for (
            let index = 0;
            index < result.content.filterOptions.length;
            index++
          ) {
            if (
              result.content.filterOptions[index].textValue &&
              !result.content.filterOptions[index].value.includes('.keyword')
            ) {
              result.content.filterOptions[index].value =
                result.content.filterOptions[index].value + '.keyword';
            } else if (!result.content.filterOptions[index].textValue) {
              result.content.filterOptions[index].value =
                result.content.filterOptions[index].value.replace(
                  '.keyword',
                  '',
                );
            }
          }
        if (this.grid[index].scroll) result['scroll'] = this.grid[index].scroll;
        result.class = this.class_names[index];
        this.oldcomponent[index] = result.component;
        this.edited.emit({ result, index });
      } else if (result === false) {
        this.pre = null;
        this.grid[index].component = this.oldcomponent[index];
      }
    });
  }
}
