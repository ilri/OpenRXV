import { Component, OnInit, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import {
  UntypedFormGroup,
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MetadataService } from 'src/app/admin/services/metadata.service';
import { MatButton } from '@angular/material/button';
import { MainListComponent } from '../main-list/main-list.component';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { NgSelectModule } from '@ng-select/ng-select';
import { MultiSourceComponent } from '../multi-source/multi-source.component';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { DynamicComponent } from 'src/app/explorer/dashboard/components/dynamic/dynamic.component';
import { Store } from '@ngrx/store';
import { AppState, SetQuery } from 'src/app/explorer/store';
import { MainBodyBuilderService } from 'src/app/explorer/services/mainBodyBuilderService/main-body-builder.service';
import { debounceTime } from 'rxjs/operators';
import { NgClass } from '@angular/common';
import { ComponentFilterConfigs } from '../../../../explorer/configs/generalConfig.interface';
import * as fromStore from '../../../../explorer/store';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-form-dialog',
  templateUrl: './form-dialog.component.html',
  styleUrls: ['./form-dialog.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    NgSelectModule,
    MatIcon,
    MatCheckbox,
    MatTooltip,
    MainListComponent,
    MultiSourceComponent,
    MatDialogActions,
    MatButton,
    DynamicComponent,
    NgClass,
  ],
})
export class FormDialogComponent implements OnInit {
  private metadataService = inject(MetadataService);
  dialogRef = inject<MatDialogRef<FormDialogComponent>>(MatDialogRef);
  data = inject(MAT_DIALOG_DATA);
  private store = inject<Store<AppState>>(Store);
  private mainBodyBuilderService = inject(MainBodyBuilderService);
  private toastr = inject(ToastrService);

  controls = [];
  form: UntypedFormGroup = new UntypedFormGroup({
    icon: new UntypedFormControl(''),
  });
  pre: any;
  formControls = [];
  metadata = [];
  previewChart = false;
  liveConfigs: any;
  skipPreview = true;
  preFilterJsonValid = true;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  onNoClick(value): void {
    this.dialogRef.close(false);
  }
  submit(value) {
    if (
      Object.hasOwn(this.form.value, 'pre_filter') &&
      this.form.value['pre_filter'] !== ''
    ) {
      try {
        JSON.parse(this.form.value['pre_filter']);
      } catch (e) {
        this.toastr.error('Invalid JSON in the field "Pre-filter"');
        return;
      }
    }
    const names_exist: Array<string> = this.data.form_data.map((d) => d.name);
    Object.keys(this.form.controls).forEach((key) => {
      if (names_exist.indexOf(key) == -1) this.form.removeControl(key);
    });
    if (this.form.valid) this.dialogRef.close(value);
  }
  dashbard_name;
  async ngOnInit() {
    this.dashbard_name = this.data.dashboard_name;
    const configs = Object.create(this.data.configs);
    const FormGroupControls: any = {};
    this.data.form_data.forEach((element) => {
      if (
        configs.componentConfigs &&
        configs.componentConfigs[element.name] != null
      ) {
        let val = configs.componentConfigs[element.name];
        if (element.name == 'source') {
          if (Array.isArray(val)) {
            val = val.map((v) => {
              v.field = v.field.replace('.keyword', '');
              return v;
            });
            if (this.data.isCounter) {
              val = val?.[0]?.field ? val[0].field : null;
            }
          } else {
            val = val.replace('.keyword', '');
          }
        }
        FormGroupControls[element.name] = new UntypedFormControl(val);
      } else if (configs[element.name])
        FormGroupControls[element.name] = new UntypedFormControl(
          configs[element.name],
        );
      else FormGroupControls[element.name] = new UntypedFormControl(null);
    });
    this.form = new UntypedFormGroup(FormGroupControls);
    this.metadata = await this.metadataService.get(this.dashbard_name, null);
    this.formControls = this.data.form_data;
    this.pre = this.form.value;

    this.form.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.previewChart = false;
      if (!this.form.valid) {
        return;
      }

      // No preview for counters or main list
      this.skipPreview =
        this.data.skipPreview ||
        !this.form.value?.['component'] ||
        this.form.value['component'] === 'MainListComponent';
      if (this.skipPreview) {
        return;
      }

      this.liveConfigs = this.prepareDashboardChart(
        this.form.value,
        this.data.gridRow,
        this.data.index,
      );
      localStorage.setItem(
        'configs',
        JSON.stringify({
          dashboard: [this.liveConfigs],
          counters: [],
          filters: [],
          defaultWithinFiltersOperator: 'or',
        }),
      );
      this.mainBodyBuilderService.start();
      setTimeout(() => {
        this.previewChart = true;
        setTimeout(() => {
          this.store.dispatch(
            new SetQuery({
              dashboard: this.dashbard_name,
              body: this.mainBodyBuilderService.buildMainQuery(0).build(),
            }),
          );

          if (this.liveConfigs?.componentConfigs?.id) {
            this.store.dispatch(
              new fromStore.SetInView({
                viewState: {
                  userSeesMe: true,
                  linkedWith: this.liveConfigs.componentConfigs.id,
                },
                id: this.liveConfigs.componentConfigs.id,
              }),
            );
          }
        }, 300);
      }, 300);
    });
  }

  prepareDashboardChart(obj, gridRow, index1) {
    const temp = {};
    if (obj.title) temp['title'] = obj.title;

    if (obj.description) temp['description'] = obj.description;
    if (obj.source) temp['source'] = obj.source;
    if (obj.sort != undefined) temp['sort'] = obj.sort;

    if (obj.source)
      temp['id'] =
        temp['source'].map((s) => s.field).join('_') +
        '_' +
        gridRow +
        '_' +
        index1;
    if (obj.size) temp['size'] = obj.size;

    // Disable filter on click when previewing
    temp['allowFilterOnClick'] = false;

    if (obj.inner_size) temp['inner_size'] = obj.inner_size;

    if (obj.direction) temp['direction'] = obj.direction;
    if (obj.stacking) temp['stacking'] = obj.stacking;
    if (obj.line_type) temp['line_type'] = obj.line_type;
    if (obj.map_type) temp['map_type'] = obj.map_type;

    if (obj.metric) temp['metric'] = obj.metric;
    if (obj.metric_field) temp['metric_field'] = obj.metric_field;

    if (obj.pre_filter) temp['pre_filter'] = obj.pre_filter;

    if (obj.data_labels) temp['data_labels'] = obj.data_labels;

    temp['data_labels_count'] = obj?.data_labels_count ?? false;
    temp['data_labels_percentage'] = obj?.data_labels_percentage ?? false;
    temp['hide_total'] = obj?.hide_total ?? false;
    temp['hide_percentage'] = obj?.hide_percentage ?? false;

    if (obj.source_x && obj.source_y) {
      temp['source'] = [obj.source_x, obj.source_y + '.keyword'];
      temp['source_y'] = obj.source_y;
      temp['source_x'] = obj.source_x;
      temp['id'] =
        obj.source_x + '_' + obj.source_y + '_' + gridRow + '_' + index1;
      temp['sort'] = obj.sort;
    }

    if (obj.content) {
      temp['content'] = obj.content;
      temp['content'].icon = 'repo';
    }

    if (obj.component == 'MainListComponent')
      temp['id'] = 'main_list' + '_' + gridRow + '_' + index1;

    if (
      obj.component == 'WheelComponent' ||
      obj.component == 'BarComponent' ||
      obj.component == 'PackedBubbleComponent' ||
      obj.component == 'PackedBubbleSplitComponent' ||
      obj.component == 'SunburstComponent'
    )
      temp['related'] = true;

    if (obj.componentConfigs && obj.componentConfigs.id) {
      temp['id'] = obj.componentConfigs.id;
    } else if (obj.id) {
      temp['id'] = obj.id;
    }

    let class_name = null;

    if (obj.class && typeof obj.class == 'string') {
      class_name = obj.class;
    }

    return {
      class: class_name,
      show: true,
      component: obj.component ? obj.component : null,
      componentConfigs: temp as ComponentFilterConfigs,
      scroll: obj.scroll ? obj.scroll : null,
      tour: true,
      sort: obj.sort,
    };
  }
}
