import { Component, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SettingsService } from '../services/settings.service';
import { FormIndexComponent } from './form/form.component';

@Component({
  selector: 'app-indexes',
  templateUrl: './indexes.component.html',
  styleUrls: ['./indexes.component.scss']
})
export class IndexesComponent implements OnInit {

  constructor(
    private settingsService: SettingsService,
    public dialog: MatDialog
  ) { }
  indexes: any;
  form: FormGroup = new FormGroup({
    indexes: new FormArray([]),
  });

  displayedColumns: string[] = [
    'id',
    'name',
    'description',
    'created_at',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;


  openDialog() {
    const dialogRef = this.dialog.open(FormIndexComponent, {
      width: '30%',
      data: {event: 'New', body: {}},
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.ngOnInit();
    });
  }
  
  deleteIndex(id) {
    var index = this.indexes.indexes.map(x => {
      return x.id;
    }).indexOf(id);
    this.indexes.indexes.splice(index, 1);
    this.dataSource = new MatTableDataSource<any>(this.indexes.indexes);
    this.settingsService.saveIndexesSettings(this.indexes, false);
  }

   editIndex(id) {
    const dialogRef = this.dialog.open(FormIndexComponent, {
      width: '30%',
      data: {event: 'Edit', body: this.indexes.indexes.filter(x => x.id == id)},
    });

    dialogRef.afterClosed().subscribe( async (result) => {
      let indexes = await this.settingsService.readIndexesSettings();
      console.log("indexes", indexes.indexes)
      this.indexes = indexes;
      this.dataSource = new MatTableDataSource<any>(indexes.indexes);
      this.dataSource.paginator = this.paginator;
      this.form.patchValue(indexes.indexes);
    });
  }
  async ngOnInit() {
    let indexes = await this.settingsService.readIndexesSettings();
    console.log("indexes", indexes.indexes)
    this.indexes = indexes;
    this.dataSource = new MatTableDataSource<any>(indexes.indexes);
    this.dataSource.paginator = this.paginator;
    this.form.patchValue(indexes.indexes);
  }

}
