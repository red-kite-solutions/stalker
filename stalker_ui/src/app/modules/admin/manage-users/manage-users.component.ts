import { SelectionModel } from '@angular/cdk/collections';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { UsersService } from 'src/app/api/users/users.service';
import { User } from 'src/app/shared/types/user.interface';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { rolesName, RolesName } from '../roles';

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
})
export class ManageUsersComponent implements OnDestroy {
  displayedColumns: string[] = ['select', 'firstName', 'lastName', 'email', 'role', 'active'];
  dataSource = new MatTableDataSource<User>();
  private dataSource$ = this.usersService.getAllUsers().subscribe((next) => {
    this.dataSource.data = next;
    this.dataSource.paginator = this.paginator;
  });

  private screenSize$ = this.mediaObserver.asObservable().pipe(
    filter((mediaChanges: MediaChange[]) => !!mediaChanges[0].mqAlias),
    distinctUntilChanged((previous: MediaChange[], current: MediaChange[]) => {
      return previous[0].mqAlias === current[0].mqAlias;
    }),
    map((mediaChanges: MediaChange[]) => {
      return mediaChanges[0].mqAlias;
    })
  );

  public roles: RolesName = rolesName;

  ngOnDestroy() {
    this.dataSource$.unsubscribe();
  }

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: string) => {
      if (screen === 'xs') return ['firstName', 'lastName', 'role'];
      if (screen === 'sm') return ['firstName', 'lastName', 'role', 'active'];
      if (screen === 'md') return ['select', 'firstName', 'lastName', 'role', 'active'];
      return this.displayedColumns;
    })
  );
  public hideDelete$ = this.screenSize$.pipe(map((screen: string) => screen === 'xs' || screen === 'sm'));
  selection = new SelectionModel<User>(true, []);

  @ViewChild(MatPaginator) paginator: MatPaginator | null;

  constructor(
    public dialog: MatDialog,
    private usersService: UsersService,
    private toastr: ToastrService,
    private mediaObserver: MediaObserver,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Users list management page title|:Users`);
    this.paginator = null;
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

  deleteUsers() {
    const bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((user: User) => {
      bulletPoints.push(`${user.firstName} ${user.lastName}`);
    });
    let data: ConfirmDialogData;
    if (bulletPoints.length > 0) {
      data = {
        text: $localize`:Confirm delete users|Confirmation message asking if the user really wants to delete the selected users:Do you really wish to delete these users permanently ?`,
        title: $localize`:Deleting users|Title of a page to delete selected users:Deleting users`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: bulletPoints,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: () => {
          this.selection.selected.forEach(async (user: User) => {
            await this.usersService.deleteUser(user._id);
            this.selection.deselect(user);
            const removeIndex = this.dataSource.data.findIndex((u: User) => u._id === user._id);
            this.dataSource.data.splice(removeIndex, 1);
            this.dataSource.paginator = this.paginator;
            this.toastr.success(
              $localize`:User deleted|Confirm the successful deletion of a user:User deleted successfully`
            );
          });
          this.dialog.closeAll();
        },
      };
    } else {
      data = {
        text: $localize`:Select users again|No users were selected so there is nothing to delete:Select the users to delete and try again.`,
        title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
      };
    }

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
