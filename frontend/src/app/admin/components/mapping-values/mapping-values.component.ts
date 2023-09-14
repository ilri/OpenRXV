import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ValuesService } from '../../services/values.service';
import { MetadataService } from '../../services/metadata.service';
import { ValuesForm } from './form/values-form.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from '../../../common.service';

@Component({
  selector: 'app-mapping-values',
  templateUrl: './mapping-values.component.html',
  styleUrls: ['./mapping-values.component.scss'],
})
export class MappingValuesComponent implements OnInit {
  constructor(
    private valuesService: ValuesService,
    public dialog: MatDialog,
    private metadataService: MetadataService,
    private activeRoute: ActivatedRoute,
    private toastr: ToastrService,
    private commonService: CommonService,
  ) {
  }

  term = '';
  metadataFields: any;
  index_name: string;
  values_index_name: string;
  exportLink: string;

  openDialog(): void {
    const values = {
      metadataFields: this.metadataFields,
      values_index_name: this.values_index_name,
    };
    const dialogRef = this.dialog.open(ValuesForm, {
      disableClose: true,
      width: '30%',
      data: values,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.refreshData();
    });
  }

  async toDelete(id) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: 'Confirmation',
        subtitle: 'Are you sure you want to delete this mapping?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.valuesService.delete(id, this.values_index_name);
        this.refreshData();
      }
    });
  }
  async toEdit(id) {
    const values = await this.valuesService.findOne(id, this.values_index_name);
    values.metadataFields = this.metadataFields;
    values.values_index_name = this.values_index_name;

    const dialogRef = this.dialog.open(ValuesForm, {
      width: '30%',
      data: values
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.refreshData();
    });
  }

  displayedColumns: string[] = ['find', 'replace', 'metadataField', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<Array<any>>([]);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  ngOnDestroy() {
    clearTimeout(this.timeout);
  }
  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('index_name');
    this.values_index_name = `${this.index_name}-values`;
    this.metadataFields = await this.metadataService.get(null, this.index_name);
    await this.refreshData();
  }
  timeout = null;

  searchChange() {
    clearTimeout(this.timeout);
    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout = setTimeout(async () => {
      await this.refreshData();
    }, 1000);
  }

  async refreshData() {
    const mappingValues = await this.valuesService.findByTerm(this.term.trim(), this.values_index_name);
    this.dataSource = new MatTableDataSource<Array<any>>(mappingValues.hits);
    this.dataSource.paginator = this.paginator;

    await this.refreshExportData(mappingValues);
  }

  async refreshExportData(mappingValues) {
    mappingValues = this.term.trim() === '' ? mappingValues : await this.valuesService.findByTerm('', this.values_index_name);
    this.exportLink = 'data:text/json;charset=UTF-8,' + encodeURIComponent(JSON.stringify(mappingValues.hits));
  }

  async importJSON(event) {
    const data: [] = await this.commonService.importJSON(event);
    const importStatus = {
      failed: [],
      success: [],
    };

    for (let i = 0; i < data.length; i++) {
      const importedItem = (data[i] as any);
      const item = {
        find: importedItem?.find.trim(),
        replace: importedItem?.replace.trim(),
        metadataField: importedItem?.metadataField,
      };
      const missingRequiredFields = [];
      if (item.find === '' || item.find == null) {
        missingRequiredFields.push('find');
      }
      if (item.replace === '' || item.replace == null) {
        missingRequiredFields.push('replace');
      }
      if (missingRequiredFields.length > 0) {
        const message = 'Mapping #' + (i + 1) + ' is missing required fields: ' + missingRequiredFields.join(' and ');
        importStatus.failed.push(message);
      } else {
        const response = await this.valuesService.post(item, this.values_index_name);
        if (response.success === true) {
          importStatus.success.push(item.find);
        } else {
          const message = 'Mapping #' + (i + 1) + ', failed to import with error: ' + (response?.message ? response.message : 'Oops! something went wrong');
          importStatus.failed.push(message);
        }

      }
    }

    const message = this.commonService.importJSONResponseMessage(importStatus, data.length, 'Value mapping(s)');
    if (message.type === 'success') {
      this.toastr.success(message.message, null, {enableHtml: true});
      this.refreshData();
    } else if (message.type === 'warning') {
      this.toastr.warning(message.message, null, {enableHtml: true});
      this.refreshData();
    } else {
      this.toastr.error(message.message, null, {enableHtml: true});
    }
  }
}
