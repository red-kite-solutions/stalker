import { SelectionModel } from '@angular/cdk/collections';
import { ENTER, TAB } from '@angular/cdk/keycodes';
import {
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatLegacyAutocomplete as MatAutocomplete, MatLegacyAutocompleteSelectedEvent as MatAutocompleteSelectedEvent } from '@angular/material/legacy-autocomplete';
import { MatLegacyChipInputEvent as MatChipInputEvent, MatLegacyChipList as MatChipList } from '@angular/material/legacy-chips';
import { MatLegacyPaginator as MatPaginator, LegacyPageEvent as PageEvent } from '@angular/material/legacy-paginator';
import {
  MatLegacyColumnDef as MatColumnDef,
  MatLegacyHeaderRowDef as MatHeaderRowDef,
  MatLegacyNoDataRow as MatNoDataRow,
  MatLegacyRowDef as MatRowDef,
  MatLegacyTable as MatTable,
  MatLegacyTableDataSource as MatTableDataSource,
} from '@angular/material/legacy-table';
import { map, Observable, startWith } from 'rxjs';
import { IdentifiedElement } from '../../types/identified-element.type';

@Component({
  selector: 'app-filtered-paginated-table',
  templateUrl: './filtered-paginated-table.component.html',
  styleUrls: ['./filtered-paginated-table.component.scss'],
})
export class FilteredPaginatedTableComponent<T extends IdentifiedElement> {
  @ContentChildren(MatHeaderRowDef) headerRowDefs!: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs!: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow!: MatNoDataRow;

  @ViewChild(MatTable, { static: true }) table!: MatTable<T>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatAutocomplete) autocomplete!: MatAutocomplete;
  @ViewChild('filterInput') filterInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chipList') chipList!: MatChipList;

  _dataSource!: MatTableDataSource<T>;
  @Input() set dataSource(data: MatTableDataSource<T>) {
    this._dataSource = data;
    this.selection.setSelection(
      ...data.data.filter((newRow: T) => {
        return this.selection.selected.some((selectedRow: T) => {
          const newRowId = selectedRow._id ? selectedRow._id : selectedRow.id;
          const selectedRowId = newRow._id ? newRow._id : newRow.id;
          return newRowId === selectedRowId;
        });
      })
    );
    this.selectionChange.emit(this.selection);
  }

  @Input() columns!: string[] | null;
  @Input() filterOptions!: string[] | null;
  @Input() isLoading = false;
  @Input() length: number | null = 0;
  @Input() routerLinkPrefix = '/';

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() filtersChange = new EventEmitter<string[]>();

  @Output() selectionChange = new EventEmitter<SelectionModel<T>>();
  @Input() selection = new SelectionModel<T>(true, []);

  filters: string[] = [];
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  separatorKeysCodes: number[] = [TAB, ENTER];
  filterForm = new UntypedFormControl('');
  filteredColumns$: Observable<string[] | null | undefined>;
  masterToggleState = false;

  constructor() {
    this.filteredColumns$ = this.filterForm.valueChanges.pipe(
      startWith(null),
      map((column: string) => this.autocompleteFilter(column))
    );
  }

  private autocompleteFilter(value: string) {
    if (!value) return this.filterOptions?.filter((col) => col !== 'select');
    const filterValue = value.toLowerCase();
    return this.filterOptions?.filter((col) => col.toLowerCase().includes(filterValue) && col !== 'select');
  }

  pageChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.pageChange.emit(event);
  }

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

  ngAfterContentInit() {
    this.columnDefs.forEach((columnDef) => this.table.addColumnDef(columnDef));
    this.rowDefs.forEach((rowDef) => this.table.addRowDef(rowDef));
    this.headerRowDefs.forEach((headerRowDef) => this.table.addHeaderRowDef(headerRowDef));
    this.table.setNoDataRow(this.noDataRow);
  }

  removeFilter(filter: string) {
    const index = this.filters.indexOf(filter);
    if (index >= 0) {
      this.filters.splice(index, 1);
      this.filtersChange.emit(this.filters);
    }
  }

  toggleSelectedRow(row: T) {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection);
  }

  addFilter(event: MatChipInputEvent) {
    const option = this.autocomplete.options.find((x) => x.active);
    const value = option ? option.viewValue.trim() : event.value;

    this.addComplexFilter(value);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.addComplexFilter(event.option.viewValue);
  }

  private addComplexFilter(value: string) {
    if (value?.includes(':')) {
      // filter is ready
      // More filter options could be treated here
      // if regex are ever supported
      this.filters.push(value);
      this.filtersChange.emit(this.filters);

      this.filterInput.nativeElement.value = '';
      this.filterForm.setValue(null);
    } else {
      // The filter category is selected, we add a ':'
      // The actual filter can now be added
      const completedString = `${value}: `;
      this.filterInput.nativeElement.value = completedString;
      this.filterForm.setValue(completedString, { emitEvent: false });
      this.refocusMatChipInput();
      // Some more autocomplete could be done here?
      // For instance, a company name could be autocompleted since
      // they are known. So are the tags. However, this component needs to stay generic
    }
  }

  editFilter($event: MouseEvent, filter: string) {
    $event.stopPropagation();
    this.removeFilter(filter);

    // Input does not update properly with mat chips and autocomplete
    // This line is therefore needed
    // https://github.com/angular/components/issues/10968
    this.filterForm.setValue(filter, { emitEvent: false });
    this.filterInput.nativeElement.value = filter;

    this.refocusMatChipInput();
  }

  private refocusMatChipInput() {
    // Removing the focus from the chips is mandatory to replace the cursor
    // to the end of the text... Took a couple hours to find that
    for (const chip of this.chipList.chips) {
      chip._hasFocus = false;
    }

    this.filterInput.nativeElement.focus();
    this.filterInput.nativeElement.selectionStart = 100000;
    this.filterInput.nativeElement.selectionEnd = 100000;
  }
}
