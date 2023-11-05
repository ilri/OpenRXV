import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UsersService } from '../../services/users.service';
import { FormComponent } from './form/form.component';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { ToastrService } from 'ngx-toastr';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  constructor(
    private usersService: UsersService,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
  ) {}

  openDialog(): void {
    const dialogRef = this.dialog.open(FormComponent, {
      width: '30%',
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.ngOnInit();
    });
  }

  async toDelete(id) {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      data: {
        title: 'Confirmation',
        subtitle: 'Are you sure you want to delete this user?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        await this.spinner.show();
        await this.usersService.deleteUser(id);
        await this.spinner.hide();
        this.toastr.success('User deleted successfully');
        this.ngOnInit();
      }
    });
  }
  async toEdit(id) {
    await this.spinner.show();
    const user = await this.usersService.getUser(id);

    const dialogRef = this.dialog.open(FormComponent, {
      width: '30%',
      data: user,
    });
    await this.spinner.hide();

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.ngOnInit();
    });
  }

  displayedColumns: string[] = [
    'id',
    'name',
    'email',
    'role',
    'created_at',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  async ngOnInit() {
    await this.spinner.show();
    const users = await this.usersService.getUsers();
    this.dataSource = new MatTableDataSource<any>(users.hits);
    this.dataSource.paginator = this.paginator;
    await this.spinner.hide();
  }
}
