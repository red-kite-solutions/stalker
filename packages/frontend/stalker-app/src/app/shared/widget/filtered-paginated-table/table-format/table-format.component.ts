import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  EventEmitter,
  HostListener,
  Input,
  Output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatColumnDef,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRowDef,
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, firstValueFrom, ReplaySubject } from 'rxjs';
import { AvatarComponent } from '../../../components/avatar/avatar.component';
import { IdentifiedElement } from '../../../types/identified-element.type';
import { ElementMenuItems, MenuIconComponent } from '../../dynamic-icons/menu-icon.component';

@Component({
  standalone: true,
  selector: 'app-table-format',
  templateUrl: './table-format.component.html',
  styleUrls: ['./table-format.component.scss'],
  imports: [
    CommonModule,
    AvatarComponent,
    MatDividerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatTableModule,
    ReactiveFormsModule,
    MatOptionModule,
    MenuIconComponent,
  ],
})
export class TableFormatComponent<T extends IdentifiedElement> implements AfterContentInit {
  @ContentChildren(MatHeaderRowDef) headerRowDefs!: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs!: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow!: MatNoDataRow;

  @ViewChild(MatTable, { static: true }) table!: MatTable<T>;

  _dataSource!: MatTableDataSource<T>;
  @Input() set dataSource(data: MatTableDataSource<T> | null) {
    this._dataSource = data || new MatTableDataSource<T>([]);
    this.selection.setSelection(
      ...this._dataSource.data.filter((newRow: T) => {
        return this.selection.selected.some((selectedRow: T) => {
          const newRowId = selectedRow._id ? selectedRow._id : selectedRow.id;
          const selectedRowId = newRow._id ? newRow._id : newRow.id;
          return newRowId === selectedRowId;
        });
      })
    );
    this.selectionChange.emit(this.selection);
  }

  @Input() noDataMessage: string =
    $localize`:No data|No data is matching the filter, the array is empty:No matching data.`;
  @Input() columns!: string[] | null;
  @Input() routerLinkPrefix = '/';
  @Input() routerLinkBuilder: ((row: T) => string | any[] | null | undefined) | undefined = undefined;
  @Input() elementLinkActive = true;
  @Input() queryParamsFunc: (row: T) => {} = () => ({});
  @Input() menuFactory?: (element: T) => ElementMenuItems[];

  @Output() selectionChange = new EventEmitter<SelectionModel<T>>();
  @Input() selection = new SelectionModel<T>(true, []);

  selectionSubject$ = new ReplaySubject<T>();
  masterToggleState = false;

  constructor() {}

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this._dataSource?.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.masterToggleState = false;
    } else {
      this.selection.select(...this._dataSource.data);
      this.masterToggleState = true;
    }
    this.selectionChange.emit(this.selection);
  }

  async ngAfterContentInit() {
    this.columnDefs.forEach((columnDef) => this.table.addColumnDef(columnDef));
    this.rowDefs.forEach((rowDef) => this.table.addRowDef(rowDef));
    this.headerRowDefs.forEach((headerRowDef) => this.table.addHeaderRowDef(headerRowDef));
    this.table.setNoDataRow(this.noDataRow);
  }

  shiftHolding$ = new BehaviorSubject<boolean>(false);
  @HostListener('document:keydown.shift', ['$event'])
  shiftDown(event: Event) {
    this.shiftHolding$.next(true);
  }
  @HostListener('document:keyup.shift', ['$event'])
  shiftUp(event: Event) {
    this.shiftHolding$.next(false);
  }

  private lastSelectIndex: number | undefined = undefined;
  async toggleSelectedRow(row: T, index: number) {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection);

    if (
      this.lastSelectIndex !== undefined &&
      this.lastSelectIndex >= 0 &&
      this.lastSelectIndex <= this._dataSource!.data.length &&
      (await firstValueFrom(this.shiftHolding$))
    ) {
      const start = this.lastSelectIndex < index ? this.lastSelectIndex : index;
      const end = this.lastSelectIndex >= index ? this.lastSelectIndex : index;
      const set = this.selection.isSelected(row);
      const data = this._dataSource!.data.slice(start, end + 1);
      if (set) {
        this.selection.select(...data);
      } else {
        this.selection.deselect(...data);
      }
      this.selectionChange.emit(this.selection);
    }
    this.lastSelectIndex = index;
  }
}
