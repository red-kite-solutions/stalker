import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { Sort, MatSort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { User } from 'src/app/shared/types/user.interface';
import { UsersService } from 'src/app/api/users/users.service';
import { ToastrService } from 'ngx-toastr';
import { StatusString } from 'src/app/shared/types/status-string.type';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
})
export class ManageUsersComponent implements OnInit {
  displayedColumns: string[] = ['select', 'firstName', 'lastName', 'email', 'role', 'active'];
  // dataSource = new MatTableDataSource<User>(ELEMENT_DATA);
  dataSource = new MatTableDataSource<User>();
  selection = new SelectionModel<User>(true, []);

  @ViewChild(MatSort) sort: MatSort | null;
  @ViewChild(MatPaginator) paginator: MatPaginator | null;

  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    public dialog: MatDialog,
    private usersService: UsersService,
    private toastr: ToastrService
  ) {
    this.sort = null;
    this.paginator = null;
  }

  async ngOnInit(): Promise<void> {
    const data = await this.usersService.getAllUsers();
    if (data) {
      this.dataSource = new MatTableDataSource<User>(data);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: User): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row._id + 1}`;
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  deleteUsers() {
    const bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((user: User) => {
      bulletPoints.push(`${user.firstName} ${user.lastName}`);
    });
    let data: ConfirmDialogData;
    if (bulletPoints.length > 0) {
      data = {
        text: 'Do you really wish to delete these users permanently ?',
        title: 'Deleting users',
        positiveButtonText: 'Cancel',
        negativeButtonText: 'Delete permanently',
        listElements: bulletPoints,
        onPositiveButtonClick: () => {
          this.dialog.closeAll();
        },
        onNegativeButtonClick: () => {
          this.selection.selected.forEach(async (user: User) => {
            const res: StatusString = await this.usersService.deleteUser(user._id);
            if (res === 'Success') {
              this.selection.deselect(user);
              const removeIndex = this.dataSource.data.findIndex((u: User) => u._id === user._id);
              this.dataSource.data.splice(removeIndex, 1);
              this.dataSource.sort = this.sort;
              this.dataSource.paginator = this.paginator;
              this.toastr.success('User deleted successfully');
            } else {
              this.toastr.error(`Error deleting user ${user.email}`);
            }
          });
          this.dialog.closeAll();
        },
      };
    } else {
      data = {
        text: 'Select the users to delete and try again.',
        title: 'Nothing to delete',
        positiveButtonText: 'Ok',
        onPositiveButtonClick: () => {
          this.dialog.closeAll();
        },
      };
    }

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  displayColumns() {
    if (window.screen.availWidth < 450) {
      return ['firstName', 'lastName', 'role'];
    }
    if (window.screen.availWidth < 525) {
      return ['firstName', 'lastName', 'role', 'active'];
    }
    if (window.screen.availWidth < 625) {
      return ['select', 'firstName', 'lastName', 'role', 'active'];
    }
    return this.displayedColumns;
  }

  hideDelete() {
    return window.screen.availWidth < 525;
  }
}
