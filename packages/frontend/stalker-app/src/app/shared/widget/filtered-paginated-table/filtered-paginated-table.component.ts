import { SelectionModel } from '@angular/cdk/collections';
import { ENTER, TAB } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipGrid, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { DateRange, MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
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
import * as moment from 'moment';
import { Moment } from 'moment';
import { NgxFileDropModule } from 'ngx-file-drop';
import { Observable, debounceTime, filter, map, startWith } from 'rxjs';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { IdentifiedElement } from '../../types/identified-element.type';
import { CodeEditorComponent } from '../code-editor/code-editor.component';

@Component({
  standalone: true,
  selector: 'app-filtered-paginated-table',
  templateUrl: './filtered-paginated-table.component.html',
  styleUrls: ['./filtered-paginated-table.component.scss'],
  imports: [
    CommonModule,
    AvatarComponent,
    MatDividerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatListModule,
    RouterModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxFileDropModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    CodeEditorComponent,
    MatOptionModule,
    MatSelectModule,
    FormsModule,
    MatDatepickerModule,
    MatTooltipModule,
  ],
})
export class FilteredPaginatedTableComponent<T extends IdentifiedElement> implements OnInit, OnDestroy {
  @ContentChildren(MatHeaderRowDef) headerRowDefs!: QueryList<MatHeaderRowDef>;
  @ContentChildren(MatRowDef) rowDefs!: QueryList<MatRowDef<T>>;
  @ContentChildren(MatColumnDef) columnDefs!: QueryList<MatColumnDef>;
  @ContentChild(MatNoDataRow) noDataRow!: MatNoDataRow;

  @ViewChild(MatTable, { static: true }) table!: MatTable<T>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatAutocomplete) autocomplete!: MatAutocomplete;
  @ViewChild('filterInput') filterInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chipList') chipGrid!: MatChipGrid;

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
  @Input() filterType: 'tokens' | 'fulltext' = 'tokens';
  @Input() columns!: string[] | null;
  @Input() filterOptions!: string[] | null;
  @Input() isLoading = false;
  @Input() length: number | null = 0;
  @Input() routerLinkPrefix = '/';
  @Input() routerLinkBuilder: ((row: T) => string | any[] | null | undefined) | undefined = undefined;
  @Input() elementLinkActive = true;
  @Input() queryParamsFunc: (row: T) => {} = () => ({});
  @Input() dateSearchEnabled = false;
  @Input() datePickerLabel =
    $localize`:Default date picker|Date picker label, the first time an item was seen:First seen`;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() filtersChange = new EventEmitter<string[]>();
  @Output() dateFiltersChange = new EventEmitter<DateRange<Date>>();
  @Output() selectionChange = new EventEmitter<SelectionModel<T>>();
  @Input() selection = new SelectionModel<T>(true, []);

  @Input() currentPage = 0;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];
  @Input() pageSize = 0;
  dateRange = new FormGroup({
    start: new FormControl<Moment | null>(null),
    end: new FormControl<Moment | null>(null),
  });
  @Input() set startDate(date: Date | null) {
    if (date) this.dateRange.get('start')?.setValue(moment(date));
  }
  @Input() set endDate(date: Date | null) {
    if (date) this.dateRange.get('end')?.setValue(moment(date));
  }

  @Input() filters: string[] = [];
  separatorKeysCodes: number[] = [TAB, ENTER];
  filterForm = new UntypedFormControl('');
  filteredColumns$: Observable<string[] | null | undefined>;
  masterToggleState = false;

  dateRangeChange$ = this.dateRange.valueChanges
    .pipe(
      debounceTime(100),
      filter(() => {
        return this.dateRange.valid;
      })
    )
    .subscribe((dr) => {
      let endDate = dr.end?.toDate();
      let endDateIncludingSelectedDay: Date | null = null;
      if (endDate) {
        endDateIncludingSelectedDay = new Date(endDate.getTime() + 1000 * 60 * 60 * 24 - 1); // 23:59:59:999
      }
      this.dateFiltersChange.emit(new DateRange<Date>(dr.start?.toDate() ?? null, endDateIncludingSelectedDay ?? null));
    });

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

  ngOnInit(): void {
    if (!this.pageSize)
      this.pageSize = this.pageSizeOptions && this.pageSizeOptions.length > 0 ? this.pageSizeOptions[0] : 10;
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

  ngOnDestroy(): void {}

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
      // For instance, a project name could be autocompleted since
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
    this.filterInput.nativeElement.focus();
    this.filterInput.nativeElement.selectionStart = 100000;
    this.filterInput.nativeElement.selectionEnd = 100000;
  }

  clearDates() {
    this.dateRange.reset();
  }
}
