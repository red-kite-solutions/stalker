import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel} from '@angular/cdk/collections';
import { Sort, MatSort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

export interface User {
  firstName: string;
  lastName: string;
  id: number;
  email: string;
  role: string;
  active: boolean;
}

const ELEMENT_DATA: User[] = [
  {id: 1, firstName: 'Hydrogen', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: false},
  {id: 2, firstName: 'Helium', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: true},
  {id: 3, firstName: 'Lithium', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: true},
  {id: 4, firstName: 'Beryllium', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: true},
  {id: 5, firstName: 'Boron', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: true},
  {id: 6, firstName: 'Carbon', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: false},
  {id: 7, firstName: 'Nitrogen', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: true},
  {id: 8, firstName: 'Oxygen', lastName: 'Hydrogen', email: "first.last@example.com", role: "admin", active: true},
  {id: 9, firstName: 'Fluorine', lastName: 'Hydrogen', email: "first.last@example.com", role: "user", active: true},
  {id: 10, firstName: 'Neon', lastName: 'Hydrogen', email: "first.last@example.com", role: "user", active: true},
  {id: 11, firstName: 'Sodium', lastName: 'Hydrogen', email: "first.last@example.com", role: "user", active: false},
  {id: 12, firstName: 'Magnesium', lastName: 'Hydrogen', email: "first.last@example.com", role: "user", active: false},
  {id: 13, firstName: 'Aluminum', lastName: 'Hydrogen', email: "first.last@example.com", role: "user", active: true},
  {id: 14, firstName: 'Silicon', lastName: 'Hydrogen', email: "first.last@example.com", role: "read-only", active: false},
  {id: 15, firstName: 'Phosphorus', lastName: 'Hydrogen', email: "first.last@example.com", role: "read-only", active: true},
  {id: 16, firstName: 'Sulfur', lastName: 'Hydrogen', email: "first.last@example.com", role: "read-only", active: true},
  {id: 17, firstName: 'Chlorine', lastName: 'Hydrogen', email: "first.last@example.com", role: "read-only", active: true},
  {id: 18, firstName: 'Argon', lastName: 'Hydrogen', email: "first.last@example.com", role: "read-only", active: false},
  {id: 19, firstName: 'Potassium', lastName: 'Hydrogen', email: "first.last@example.com", role: "read-only", active: true},
  {id: 20, firstName: 'Calcium', lastName: 'Hydrogen', email: "first.last@example.com", role: "read-only", active: false},
];

@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {

  displayedColumns: string[] = ['select', 'id', 'firstName', 'lastName', 'email', 'role', 'active'];
  dataSource = new MatTableDataSource<User>(ELEMENT_DATA);
  selection = new SelectionModel<User>(true, []);
  
  @ViewChild(MatSort) sort: MatSort | null;
  @ViewChild(MatPaginator) paginator: MatPaginator | null;

  constructor(private _liveAnnouncer: LiveAnnouncer, public dialog: MatDialog) { 
    this.sort = null;
    this.paginator = null;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
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
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
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

  editUser(row : User) {
    console.log("Going to edit user " + row.id);
  }

  createUser() {
    console.log("Create user");
  }

  deleteUsers() {
    let bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((user: User) => {
      bulletPoints.push(`${user.firstName} ${user.lastName}`);
    });
    let data: ConfirmDialogData;
    if(bulletPoints.length > 0) {
      data = {
        text: "Do you really wish to delete these users permanently ?",
        title: "Deleting users",
        positiveButtonText: "Cancel",
        negativeButtonText: "Delete permanently",
        listElements:  bulletPoints,
        onPositiveButtonClick: () => {
          this.dialog.closeAll();
        },
        onNegativeButtonClick: () => {
          this.selection.selected.forEach((user: User) => {
            console.log(`Deleting user ${user.id}`);
            this.selection.deselect(user);
          });
          this.dialog.closeAll();
        }
      }
    } else {
      data = {
        text: "Select the users to delete and try again.",
        title: "Nothing to delete",
        positiveButtonText: "Ok",
        onPositiveButtonClick: () => {
          this.dialog.closeAll();
        }
      }
    }
    
    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false
    });


    
  }



}

