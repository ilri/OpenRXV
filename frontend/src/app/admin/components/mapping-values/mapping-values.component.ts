import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ValuesService } from '../../services/values.service';
import { MetadataService } from '../../services/metadata.service';
import { ValuesForm } from './form/values-form.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { ActivatedRoute } from '@angular/router';

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
  ) {
  }

  term = '';
  metadataFields: any;
  index_name: string;
  values_index_name: string;

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
      if (result) this.ngOnInit();
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
        this.ngOnInit();
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
      if (result) this.ngOnInit();
    });
  }

  displayedColumns: string[] = ['find', 'replace', 'metadataField', 'created_at', 'actions'];
  dataSource = new MatTableDataSource<Array<any>>([]);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  ngOnDestroy() {
    clearTimeout(this.timeout);
  }
  async ngOnInit() {
    this.index_name = this.activeRoute.snapshot.paramMap.get('name');
    this.values_index_name = `${this.index_name}-values`;
    this.metadataFields = await this.metadataService.get(null, this.index_name);
    const mappingvalues = await this.valuesService.findByTerm(this.term, this.values_index_name);
    this.dataSource = new MatTableDataSource<Array<any>>(mappingvalues.hits);
    this.dataSource.paginator = this.paginator;
  }
  timeout = null;

  searchChange() {
    clearTimeout(this.timeout);
    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout = setTimeout(async () => {
      const data = await this.valuesService.findByTerm(this.term, this.values_index_name);
      this.dataSource = new MatTableDataSource<Array<any>>(data.hits);
      this.dataSource.paginator = this.paginator;
    }, 1000);
  }
}
