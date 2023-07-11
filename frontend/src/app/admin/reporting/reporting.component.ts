import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ReprotingFormComponent } from './reproting-form/reproting-form.component';
import { DialogComponent } from './dialog/dialog.component';
import { SettingsService } from '../services/settings.service';
import { MetadataService } from '../services/metadata.service';
import { DocComponent } from './doc/doc.component';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-reporting',
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss'],
})
export class ReportingComponent implements OnInit {
  reports: any;
  fileName;
  dataSource: any;
  confirmation = false;
  dialogRef: MatDialogRef<any>;
  envireoment = environment.api;
  metadata: any;
  constructor(
    private settingsService: SettingsService,
    public dialog: MatDialog,
    private metadataService: MetadataService,
  ) {}

  async ngOnInit() {
    this.reports = await this.settingsService.readReports();
    this.dataSource = await this.settingsService.retreiveMetadata;
    this.metadata = await this.metadataService.get();
  }

  newReport() {
    const dialogRef = this.dialog.open(ReprotingFormComponent, {
      data: {
        form_data: { title: '', fileType: '', file: '' },
        reports: this.reports,
        index: -1,
      },
      width: '650px',
      height: '550px',
    });
  }

  delete(index) {
    const dialog = this.dialog.open(DialogComponent, {
      data: { reportData: this.reports[index] },
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.reports.splice(index, 1);
        this.settingsService.saveReportsSettings(this.reports);
      }
    });
  }

  edit(index) {
    this.dialogRef = this.dialog.open(ReprotingFormComponent, {
      data: {
        form_data: this.reports[index],
        reports: this.reports,
        index: index,
      },
      width: '650px',
      height: '550px',
    });
  }
  copyMessage(val: string) {
    const selBox = document.createElement('textarea');
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  showDoc() {
    const dialogRef = this.dialog.open(DocComponent, { width: '1300px' });
  }
  downloadfile(file) {
    this.settingsService.getFile(file);
  }
}
