import {
  Component,
  Input,
  OnInit,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MetadataService } from 'src/app/admin/services/metadata.service';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-multi-source',
  templateUrl: './multi-source.component.html',
  styleUrls: ['./multi-source.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatIconButton,
    MatIcon,
    MatButton,
  ],
})
export class MultiSourceComponent implements OnInit {
  private metadataService = inject(MetadataService);
  private cd = inject(ChangeDetectorRef);

  @Input() baseForm: UntypedFormGroup = null;
  @Input() dashbard_name: string = null;

  sourceControls: UntypedFormGroup[] = [];
  metadata = [];

  sortOptions = [
    { name: 'Alphabetical Descending', value: '_key_desc' },
    { name: 'Alphabetical Ascending', value: '_key_asc' },
    { name: 'Metric Descending', value: 'metric_desc' },
    { name: 'Metric Ascending', value: 'metric_asc' },
  ];

  baseSourceGroup(element = null) {
    return {
      field: new UntypedFormControl(element ? element.field : ''),
      limit: new UntypedFormControl(element ? element.limit : 10),
      order: new UntypedFormControl(element ? element.order : 'metric_desc'),
    };
  }

  async ngOnInit() {
    const sourceValue = this.baseForm.get('source').value;
    this.metadata = await this.metadataService.get(this.dashbard_name, null);

    if (Array.isArray(sourceValue)) {
      sourceValue.forEach((element) => {
        this.sourceControls.push(
          new UntypedFormGroup(this.baseSourceGroup(element)),
        );
      });
    } else if (sourceValue && typeof sourceValue === 'object') {
      this.sourceControls.push(
        new UntypedFormGroup(this.baseSourceGroup(sourceValue)),
      );
    } else if (typeof sourceValue === 'string' && sourceValue) {
      this.sourceControls.push(
        new UntypedFormGroup(this.baseSourceGroup({ field: sourceValue })),
      );
    }

    if (this.sourceControls.length === 0) {
      this.sourceControls.push(new UntypedFormGroup(this.baseSourceGroup()));
    }

    this.updateBaseForm();
  }

  updateBaseForm() {
    this.baseForm.removeControl('source');
    this.baseForm.addControl(
      'source',
      new UntypedFormArray(this.sourceControls),
    );
    this.cd.detectChanges();
  }

  delete(index) {
    this.sourceControls.splice(index, 1);
    this.updateBaseForm();
  }

  addNewSource() {
    this.sourceControls.push(new UntypedFormGroup(this.baseSourceGroup()));
    this.updateBaseForm();
  }
}
