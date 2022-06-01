import { SelectionModel } from '@angular/cdk/collections';
import { AfterContentInit, Component, ContentChild, ContentChildren, Input, QueryList, ViewChild } from '@angular/core';
import {
  MatColumnDef,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
} from '@angular/material/table';

@Component({
  selector: 'app-filtered-paged-table',
  templateUrl: './filtered-paged-table.component.html',
  styleUrls: ['./filtered-paged-table.component.scss'],
})
export class FilteredPagedTableComponent<T> implements AfterContentInit {
  @ContentChildren(MatHeaderRowDef) headerRowDefs!: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs!: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow!: MatNoDataRow;

  @ViewChild(MatTable, { static: true }) table!: MatTable<T>;

  @Input() dataSource!: MatTableDataSource<T>;
  @Input() columns!: string[];

  selection = new SelectionModel<T>(true, []);

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource?.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    // if (!this.dataSource?.data) {
    //   return;
    // }

    this.selection.select(...this.dataSource.data);
  }

  ngAfterContentInit() {
    this.columnDefs.forEach((columnDef) => this.table.addColumnDef(columnDef));
    this.rowDefs.forEach((rowDef) => this.table.addRowDef(rowDef));
    this.headerRowDefs.forEach((headerRowDef) => this.table.addHeaderRowDef(headerRowDef));
    this.table.setNoDataRow(this.noDataRow);
  }
}
