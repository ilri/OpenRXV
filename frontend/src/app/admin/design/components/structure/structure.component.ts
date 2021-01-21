import { Component, OnInit, Input, Inject, Output, EventEmitter } from '@angular/core';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { icons_list } from './icons';

@Component({
  selector: 'app-structure',
  templateUrl: './structure.component.html',
  styleUrls: ['./structure.component.scss']
})
export class StructureComponent implements OnInit {
  @Output() edited: EventEmitter<any> = new EventEmitter()
  @Output() onAdd: EventEmitter<any> = new EventEmitter()
  @Output() onDelete: EventEmitter<boolean> = new EventEmitter()
  @Output() rowDeleted: EventEmitter<boolean> = new EventEmitter()
  class_names = []
  currentIndex
  options = [
    { name: "Pie Chart", value: "PieComponent", icon: "pie_chart" },
    { name: "Word Cloud", value: "WordcloudComponent", icon: "filter_drama" },
    { name: "World Map", value: "MapComponent", icon: "map" },
    { name: "List", value: "ListComponent", icon: "list" },
    { name: "Bars Chart", value: "BarComponent", icon: "bar_chart" },
    { name: "Dependency Wheel", value: "WheelComponent", icon: "group_work" },
    { name: "Packed Bubble", value: "PackedBubbleComponent", icon: "bubble_chart" },
    { name: "Packed Bubble Split", value: "PackedBubbleSplitComponent", icon: "bubble_chart" },
    { name: "Main Items list", value: "MainListComponent", icon: "view_list" },
    { name: "Column with rotated labels", value: 'SingleBarComponent', icon: 'bar_chart' },
    { name: "Line", value: 'LineComponent', icon: 'bar_chart' }
  ]
  sortoptions = [
    {name: 'Alphabetical', value: true},
    {name: 'Doc_count', value: false}
  ]
  pre
  baseform = [
    {
      name: 'component',
      label: 'Component Type',
      type: 'select',
      items: this.options,
      onChange: (event) => {
        this.pre = event;
        this.setFormDataOptions(event.value)
        this.dialogRef.close();
        this.openDialog(this.currentIndex);
      },
      required: true,
    },


  ]
  dialogRef: MatDialogRef<any>
  form_data = [];
  @Input() grid;

  dialogReficons: MatDialogRef<any>
  iconConfigs = {
    componentConfigs: {
      icon: "pie_chart",
    }
  }
  iconsForm = [
    {
      name: 'icon',
      label: 'Select Icon',
      icons: true,
      type: 'select',
      items: icons_list.map(d => { return { name: d.name, value: d.name } }),
      onChange: (event) => {
        // this.pre = event;
      },
      required: true,
    }
  ]
  setFormDataOptions(value) {
    switch (value) {
      case 'PieComponent':
      case 'WordcloudComponent':
      case 'MapComponent':
      case 'ListComponent':
      case 'WheelComponent':
        this.form_data = [...this.baseform, ...[{
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
          name: 'size',
          label: 'Number of results',
          type: 'number',
          required: false,
        },
        {
          name: 'description',
          label: 'Tour Desctiption',
          type: 'textarea',
          required: true,
        }]]
        break;

      case 'MainListComponent':
        this.form_data = [...this.baseform, ...
          [

            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
            },
            {
              name: 'description',
              label: 'Tour Desctiption',
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
            }

          ]
        ]
        break;

      default:
        this.form_data = [...this.baseform,
        ...[
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
              type: 'metadata',
              required: true,
            },
            {
              name: 'size',
              label: 'Number of results',
              type: 'number',
              required: true,
            },
            {
              name: 'agg_on',
              label: 'Values from source leave empty for items count',
              type: 'metadata',
              required: false,
            },
            {
              name: 'sort',
              label: 'Order By',
              type: 'select',
              items: this.sortoptions,
              required: true
            },
            {
              name: 'description',
              label: 'Tour Desctiption',
              type: 'textarea',
              required: true,
            },
          ],
        ]
        ]
        break;
    }
  }
  constructor(public dialog: MatDialog) { }

  oldcomponent = [];

  ngOnInit(): void {

    this.grid.forEach((element, index) => {
      this.class_names[index] = element.class
      this.oldcomponent[index] = element.component
    });
    this.iconConfigs.componentConfigs.icon = this.grid[0]?.scroll?.icon || null
  }

  addComponent(event) {
    this.onAdd.emit(event)
    this.openDialog(event)
  }



  icon(component) {
    let filterd = this.options.filter(d => d.value == component)
    if (filterd.length && filterd[0])
      return filterd[0].icon
  }

  word(component) {
    let filterd = this.options.filter(d => d.value == component)
    if (filterd.length && filterd[0])
      return filterd[0].name
  }

  delete(index) {
    this.onDelete.emit(index)
  }

  rowDelete() {
    this.rowDeleted.emit(true)
  }

  contentChange(content, i) {
    this.grid[i].componentConfigs['content'] = content
    let cat = {
      class: this.class_names[i],
      scroll: this.grid[i].scroll,
      component: this.grid[i].component,
      ...this.grid[i].componentConfigs
    }
    this.edited.emit({ result: cat, index: i })
  }

  setIcon() {

    this.dialogReficons = this.dialog.open(FormDialogComponent, {
      width: '456px',
      minHeight: '456px',
      data: { form_data: this.iconsForm, configs: this.iconConfigs }
    });
    this.dialogReficons.afterClosed().subscribe(result => {

      if (result) {
        this.grid.forEach((element, index) => {
          if (index == 0)
            element['scroll'] = { icon: result.icon }
          else
          element['scroll'] = { linkedWith: this.grid[0].componentConfigs.id }
        });

      }


    });
  }

  openDialog(index): void {
    if (this.pre)
      this.grid[index].component = this.pre.value;

    this.currentIndex = index;
    this.setFormDataOptions(this.grid[index].component)
    this.dialogRef = this.dialog.open(FormDialogComponent, {
      width: this.grid[index].component == 'MainListComponent' ? '1100px' : '456px',
      data: { form_data: Object.create(this.form_data), configs: Object.create(this.grid[index]) }
    });

    this.dialogRef.afterClosed().subscribe(result => {
 
      
      if (result) {
        if (result.component == 'MainListComponent')
          for (let index = 0; index < result.content.filterOptions.length; index++) {
            if (result.content.filterOptions[index].textValue && !result.content.filterOptions[index].value.includes('.keyword')) {
              result.content.filterOptions[index].value = result.content.filterOptions[index].value + ".keyword"
            }
            else if (!result.content.filterOptions[index].textValue) {
              result.content.filterOptions[index].value = result.content.filterOptions[index].value.replace('.keyword', '')
            }
          }
        if (this.grid[index].scroll)
          result['scroll'] = this.grid[index].scroll
        result.class = this.class_names[index];
        this.oldcomponent[index] = result.component
        this.edited.emit({ result, index })
      }
      else if (result === false) {
        this.pre = null;
        this.grid[index].component = this.oldcomponent[index];
      }
    });
  }
}
