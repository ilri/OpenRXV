import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SettingsService } from '../../../admin/services/settings.service';
import { FormDialogComponent } from '../../design/components/form-dialog/form-dialog.component';
import { MetadataService } from '../../services/metadata.service';
import { UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-reproting-form',
  templateUrl: './reproting-form.component.html',
  styleUrls: ['./reproting-form.component.scss'],
})
export class ReprotingFormComponent implements OnInit {
  openDialogs: MatDialogRef<any>;
  constructor(
    private settingsService: SettingsService,
    public dialogRef: MatDialogRef<FormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private metadataService: MetadataService,
  ) {}
  preReport: any;
  preform: any;
  formValues: any;
  file;
  initialForm;
  metadata: any;
  labels = [];
  dashboard_name: string;
  profileForm = new UntypedFormGroup({
    title: new UntypedFormControl(''),
    fileType: new UntypedFormControl(''),
    file: new UntypedFormControl(''),
  });
  async ngOnInit() {
    this.dashboard_name = this.data.dashboard_name;
    this.profileForm.get('title').setValue(this.data.form_data.title);
    this.profileForm.get('fileType').setValue(this.data.form_data.fileType);
    this.profileForm.get('file').setValue(this.data.form_data.file);
    this.formValues = Object.assign({}, this.data.form_data);
    this.initialForm = Object.getOwnPropertyDescriptors(this.data.form_data);
    this.metadata = await this.metadataService.get();
    if (this.data.form_data.fileType == 'xlsx')
      this.labels = this.formValues.tags;
  }
  async saveForm() {
    this.formValues = this.profileForm.value;
    this.formValues.tags = this.labels;
    if (this.profileForm.value.fileType == 'xlsx')
      this.profileForm.value.file = this.profileForm.value.title + '.xlsx';
    if (this.data.index == -1) this.data.reports.push(this.formValues);
    else this.data.reports[this.data.index] = this.formValues;

    this.saveDate();
  }
  add() {
    this.labels.push({ metadata: '', label: '' });
  }

  closeForm() {
    this.formValues.title = this.initialForm.title.value;
    this.formValues.file = this.initialForm.file.value;
    this.formValues.fileType = this.initialForm.fileType.value;
    this.data.reports[this.data.index] = this.formValues;
    this.dialogRef.close();
  }

  fileChange(event) {
    this.upload(event.target.files[0]);
  }

  removeFile() {
    this.formValues.file = '';
  }

  async upload(file: File) {
    this.profileForm.value.file = await this.settingsService.uploadFile(file);
  }

  saveDate() {
    this.settingsService.saveReportsSettings(this.data.reports, this.dashboard_name);
    this.dialogRef.close(this.formValues);
  }
  deleteSource(index) {
    this.labels.splice(index, 1);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.labels, event.previousIndex, event.currentIndex);
  }
}
