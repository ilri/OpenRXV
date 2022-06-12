import { Component, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ReprotingFormComponent } from './reproting-form/reproting-form.component';
import { DialogComponent } from './dialog/dialog.component';
import { SettingsService } from '../services/settings.service';
import { MetadataService } from '../services/metadata.service';
import { DocComponent } from './doc/doc.component';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
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
  dashboard_name:string;
  constructor(
    private settingsService: SettingsService,
    public dialog: MatDialog,
    private metadataService: MetadataService,
    private activeRoute:ActivatedRoute
  ) {}

  async ngOnInit() {
    this.dashboard_name = this.activeRoute.snapshot.paramMap.get('name');
    this.reports = await this.settingsService.readReports(this.dashboard_name);
    this.dataSource = await this.settingsService.retreiveMetadata;
    this.metadata = await this.metadataService.get( this.dashboard_name);
  
  }

  newReport() {
    let dialogRef = this.dialog.open(ReprotingFormComponent, {
      data: {
        dashboard_name: this.dashboard_name,
        form_data: { title: '', fileType: '', file: '' },
        reports: this.reports,
        index: -1,
      },
      width: '650px',
      height: '550px',
    });
  }

  delete(index) {
    let dialog = this.dialog.open(DialogComponent, {
      data: {dashboard_name:this.dashboard_name, reportData: this.reports[index] },
    });
    dialog.afterClosed().subscribe((result) => {
      if (result) {
        this.reports.splice(index, 1);
        this.settingsService.saveReportsSettings(this.reports,this.dashboard_name);
      }
    });
  }

  edit(index) {
    this.dialogRef = this.dialog.open(ReprotingFormComponent, {
      data: {
        dashboard_name:this.dashboard_name,
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
    let dialogRef = this.dialog.open(DocComponent, { width: '1300px' });
  }
  downloadfile(file) {
    this.settingsService.getFile(file);
  }
}
