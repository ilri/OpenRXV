import { Component, OnInit } from '@angular/core';
import {
  ComponentCounterConfigs,
  ComponentFilterConfigs,
  searchOptions,
  Tour,
} from 'src/app/explorer/configs/generalConfig.interface';
import { SettingsService } from '../services/settings.service';
import { MatDialog } from '@angular/material/dialog';
import { GridComponent } from './components/grid/grid.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SortComponent } from './components/sort/sort.component';
import { environment } from 'src/environments/environment';
import { FormDialogComponent } from './components/form-dialog/form-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from '../../common.service';

@Component({
  selector: 'app-design',
  templateUrl: './design.component.html',
  styleUrls: ['./design.component.scss'],
})
export class DesignComponent implements OnInit {
  constructor(
    public dialog: MatDialog,
    private settingsService: SettingsService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private activeRoute: ActivatedRoute,
    private commonService: CommonService,
  ) {}
  counters: Array<any> = [];
  filters: Array<any> = [];
  dashboard: Array<any> = [];
  dashboard_name: string;
  exportLink: string;
  footer: any = null;
  welcome: any;
  welcome_text = '';
  footerEditor = {
    height: 250,
    forced_root_block: 'div',
    relative_urls: false,
    images_upload_url: environment.api + '/settings/upload/image',
    images_upload_base_path: environment.api + '/',
    plugins: [
      'advlist autolink lists link image charmap print preview anchor',
      'searchreplace visualblocks code fullscreen',
      'insertdatetime media table paste code help wordcount',
      'image code',
    ],
    toolbar:
      'code| undo redo | bold italic underline strikethrough | forecolor backcolor casechange permanentpen formatpainter removeformat |fontselect fontsizeselect formatselect | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist checklist | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media pageembed template link anchor codesample | a11ycheck ltr rtl | showcomments addcomment',
  };
  newRow(): void {
    const dialogRef = this.dialog.open(GridComponent, {
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.dashboard.push(result);
    });
  }

  sortCounter() {
    const dialogRef = this.dialog.open(SortComponent, {
      data: this.counters,
      width: '450px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.counters = result;
    });
  }
  async ngOnInit() {
    await this.spinner.show();
    const dashboard_name = (this.dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name'));
    const { counters, filters, dashboard, footer, welcome } =
      await this.settingsService.readExplorerSettings(dashboard_name);
    if (welcome.componentConfigs && welcome.componentConfigs.text)
      this.welcome_text = welcome.componentConfigs.text;
    if (!this.welcome)
      this.welcome = {
        show: true,
        component: 'WelcomeComponent',
        componentConfigs: {
          id: 'welcome',
          description: 'Welcome to AReS - Agricultural Research e-Seeker',
          title: 'Greetings',
        } as Tour,
        tour: true,
      };
    this.counters = counters;
    this.filters = filters;
    this.dashboard = dashboard;
    this.footer = footer;
    this.welcome = welcome;
    this.exportLink =
      'data:text/json;charset=UTF-8,' +
      encodeURIComponent(
        JSON.stringify({
          welcome: this.welcome,
          counters: this.counters,
          filters: this.filters,
          dashboard: this.dashboard,
          footer: this.footer,
        }),
      );
    await this.spinner.hide();
  }

  populateForm(settings) {
    const { counters, filters, dashboard, footer, welcome } = settings;
    if (welcome.componentConfigs && welcome.componentConfigs.text)
      this.welcome_text = welcome.componentConfigs.text;
    if (!this.welcome)
      this.welcome = {
        show: true,
        component: 'WelcomeComponent',
        componentConfigs: {
          id: 'welcome',
          description: 'Welcome to AReS - Agricultural Research e-Seeker',
          title: 'Greetings',
        } as Tour,
        tour: true,
      };
    this.counters = counters;
    this.filters = filters;
    this.dashboard = dashboard;
    this.footer = footer;
    this.welcome = welcome;
    this.exportLink =
      'data:text/json;charset=UTF-8,' +
      encodeURIComponent(
        JSON.stringify({
          welcome: this.welcome,
          counters: this.counters,
          filters: this.filters,
          dashboard: this.dashboard,
          footer: this.footer,
        }),
      );
  }

  onAddDashboardComponent(index2, index) {
    this.dashboard[index][index2] = this.createDashboardItem({}, index, index2);
  }
  dashboardEdited(event, index) {
    this.dashboard[index][event.index] = this.createDashboardItem(
      event.result,
      index,
      event.index,
    );
  }

  filtersEdited(value, index) {
    this.filters[index] = this.createFilter(value);
  }
  onFilterDelete(bool, i) {
    if (bool) this.filters.splice(i, 1);
  }
  dashboardRawDeleted(bool, index) {
    if (bool) this.dashboard.splice(index, 1);
  }
  onDashboardItemDelete(index, index2) {
    delete this.dashboard[index2][index].component;
    delete this.dashboard[index2][index].componentConfigs;
  }

  counterEdited(value, index) {
    this.counters[index] = this.createCounter(value);
  }
  dropDashboard(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.dashboard, event.previousIndex, event.currentIndex);
  }
  dropFilter(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.filters, event.previousIndex, event.currentIndex);
  }
  newFilter() {
    this.filters.push(this.createFilter({ source: null, placeholder: null }));
  }

  newCounter() {
    this.counters.push(
      this.createCounter({ source: null, title: null, description: null }),
    );
  }

  onCounterDelete(bool, i) {
    if (bool) this.counters.splice(i, 1);
  }
  dialogRef;
  form_data = [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      required: true,
    },
    {
      name: 'show',
      label: 'Active',
      type: 'check',
      required: true,
    },
  ];

  welcomeSettings() {
    this.dialogRef = this.dialog.open(FormDialogComponent, {
      width: '456px',
      data: {
        form_data: this.form_data,
        configs: this.welcome,
      },
    });

    this.dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const obj = {
          show: true,
          component: 'WelcomeComponent',
          componentConfigs: result as Tour,
          tour: true,
        };
        (obj.componentConfigs['id'] = 'welcome'),
          (obj.componentConfigs['text'] = this.welcome_text);
        this.welcome = obj;
      }
    });
  }

  async save() {
    const dashboard_name =
      this.activeRoute.snapshot.paramMap.get('dashboard_name');
    if (
      this.dashboard.filter((d) => d.filter((e) => e.scroll == null).length > 0)
        .length == 0
    ) {
      await this.spinner.show();
      this.welcome.componentConfigs['text'] = this.welcome_text;
      const data = {
        welcome: this.welcome,
        counters: this.counters,
        filters: this.filters,
        dashboard: this.dashboard,
        footer: this.footer,
      };
      await this.settingsService.saveExplorerSettings(dashboard_name, data);
      this.exportLink =
        'data:text/json;charset=UTF-8,' +
        encodeURIComponent(JSON.stringify(data));
      this.toastr.success('Settings have been saved successfully');
      await this.spinner.hide();
    } else {
      this.toastr.error('Please set icons of rows before you save');
    }
  }
  createDashboardItem(obj, index, index1) {
    const temp = {};
    if (obj.title) temp['title'] = obj.title;

    if (obj.description) temp['description'] = obj.description;
    if (obj.source)
      temp['source'] = obj.source == 'total' ? obj.source : obj.source;
    if (obj.sort != undefined) temp['sort'] = obj.sort;

    if (obj.source) temp['id'] = temp['source'] + '_' + index + '_' + index1;
    if (obj.size) temp['size'] = obj.size;

    if (obj.agg_on) temp['agg_on'] = obj.agg_on;

    if (obj.allowFilterOnClick)
      temp['allowFilterOnClick'] = obj.allowFilterOnClick;

    if (obj.inner_size) temp['inner_size'] = obj.inner_size;

    if (obj.source_x && obj.source_y) {
      temp['source'] = [obj.source_x, obj.source_y + '.keyword'];
      temp['source_y'] = obj.source_y;
      temp['source_x'] = obj.source_x;
      temp['id'] =
        obj.source_x + '_' + obj.source_y + '_' + index + '_' + index1;
      temp['sort'] = obj.sort;
    }

    if (obj.content) {
      temp['content'] = obj.content;
      temp['content'].icon = 'repo';
    }

    if (obj.component == 'MainListComponent')
      temp['id'] = 'main_list' + '_' + index + '_' + index1;

    if (
      obj.component == 'WheelComponent' ||
      obj.component == 'BarComponent' ||
      obj.component == 'PackedBubbleComponent' ||
      obj.component == 'PackedBubbleSplitComponent' ||
      obj.component == 'LineComponent'
    )
      temp['related'] = true;

    let class_name: null;

    if (typeof obj.class == 'string') class_name = obj.class;

    return {
      class: this.dashboard[index][index1].class + ' no-side-padding',
      show: true,
      component: obj.component ? obj.component : null,
      componentConfigs: temp as ComponentFilterConfigs,
      scroll: obj.scroll ? obj.scroll : null,
      tour: true,
      sort: obj.sort,
    };
  }
  createFilter(obj) {
    const temp = {};
    if (obj.text) temp['text'] = obj.text;

    if (obj.placeholder) temp['placeholder'] = obj.placeholder;
    if (obj.description) temp['description'] = obj.description;
    if (obj.is_advanced) temp['is_advanced'] = obj.is_advanced;

    if (obj.border) temp['border'] = obj.border;

    if (obj.source) {
      if (obj.source == 'total') temp['source'] = obj.source;
      else {
        if (obj.source.includes('.keyword')) temp['source'] = obj.source;
        else temp['source'] = obj.source + '.keyword';
      }
    }
    // temp['source'] = obj.source == 'total' ? obj.source : obj.source + '.keyword'

    if (obj.component == 'SearchComponent')
      temp['type'] = searchOptions.allSearch;

    return {
      show: true,
      component: obj.component ? obj.component : null,
      componentConfigs: temp as ComponentFilterConfigs,
    };
  }
  createCounter(obj) {
    const temp = {};

    if (obj.title) temp['title'] = obj.title;

    if (obj.icon) temp['icon'] = obj.icon;

    if (obj.description) temp['description'] = obj.description;

    if (obj.source) {
      temp['source'] =
        obj.source == 'total' ? obj.source : obj.source + '.keyword';

      temp['id'] = 'counter_' + obj.source;
      if (obj.filter) {
        temp['id'] = 'counter_' + obj.source + obj.filter.replace(/\s/g, '');
      }
    }

    if (obj.filter) temp['filter'] = obj.filter;
    if (obj.type) temp['type'] = obj.type;

    if (obj.percentageFromTotal)
      temp['percentageFromTotal'] = obj.percentageFromTotal;

    return {
      show: true,
      componentConfigs: temp as ComponentCounterConfigs,
      scroll: {
        icon: 'dashboard',
      },
      tour: true,
    };
  }

  async importJSON(event) {
    await this.spinner.show();
    const importedItem: any = await this.commonService.importJSON(event);
    const importStatus = {
      failed: [],
      success: [],
    };

    const appearance = {
      counters: importedItem?.counters,
      filters: importedItem?.filters,
      dashboard: importedItem?.dashboard,
      footer: importedItem?.footer,
      welcome: importedItem?.welcome,
    };
    this.populateForm(appearance);
    importStatus.success.push(importedItem);

    await this.spinner.hide();
    const message = this.commonService.importJSONResponseMessage(
      importStatus,
      1,
      'Appearance',
    );
    if (message.type === 'success') {
      this.toastr.success(message.message, null, { enableHtml: true });
    } else if (message.type === 'warning') {
      this.toastr.warning(message.message, null, { enableHtml: true });
    } else {
      this.toastr.error(message.message, null, { enableHtml: true });
    }
  }
}
