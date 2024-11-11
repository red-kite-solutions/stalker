import { ENTER, TAB } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
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
  MatTableModule,
} from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import * as moment from 'moment';
import { Moment } from 'moment';
import { NgxFileDropModule } from 'ngx-file-drop';
import { Observable, debounceTime, distinctUntilChanged, filter, map, startWith } from 'rxjs';
import { IdentifiedElement } from '../../types/identified-element.type';
import { TableFiltersSourceBase } from './table-filters-source';

export interface ElementMenuItems {
  label: string;
  icon: string;
  action: () => Promise<unknown> | void;
  hidden?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-filtered-paginated-table',
  templateUrl: './filtered-paginated-table.component.html',
  styleUrls: ['./filtered-paginated-table.component.scss'],
  imports: [
    CommonModule,
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
  @ViewChild('tabletop', { read: ElementRef }) filterDiv!: ElementRef;

  @Input() noDataMessage: string =
    $localize`:No data|No data is matching the filter, the array is empty:No matching data.`;
  @Input() filterType: 'tokens' | 'fulltext' = 'tokens';
  @Input() columns!: string[] | null;
  @Input() filterOptions!: string[] | null;
  @Input() negatableFilterOptions = this.filterOptions;
  @Input() isLoading = false;
  @Input() length: number | null = 0;
  @Input() dateSearchEnabled = false;
  @Input() datePickerLabel =
    $localize`:Default date picker|Date picker label, the first time an item was seen:First seen`;

  @Input() currentPage = 0;
  @Input() pageSizeOptions: number[] = [5, 25, 50, 100];
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

  @Input() filterEnabled: boolean = true;
  @Input() filters: string[] = [];
  separatorKeysCodes: number[] = [TAB, ENTER];
  filterForm = new UntypedFormControl('');
  filteredColumns$: Observable<string[] | null | undefined>;
  masterToggleState = false;

  dateRangeChange$ = this.dateRange.valueChanges
    .pipe(
      debounceTime(100),
      filter(() => this.dateRange.valid),
      distinctUntilChanged(
        (a, b) => a.start?.toISOString() === b.start?.toISOString() && a.end?.toISOString() === b.end?.toISOString()
      )
    )
    .subscribe(async (dr) => {
      let endDate = dr.end?.toDate();
      let endDateInclusive: Date | null = null;
      if (endDate) {
        endDateInclusive = new Date(endDate.getTime() + 1000 * 60 * 60 * 24 - 1); // 23:59:59:999
      }
      const dateRange = new DateRange<Date>(dr.start?.toDate() ?? null, endDateInclusive ?? null);
      await this.filterSource.setDates(dateRange);
      this.resetPaging();
    });

  private filterSourceSub = this.filterSource.filters$.subscribe(({ filters, dateRange, pagination }) => {
    this.filters = filters;
    this.dateRange.setValue({
      start: dateRange?.start ? moment(dateRange.start) : null,
      end: dateRange?.end ? moment(dateRange.end).add(-(1000 * 60 * 60 * 24 - 1), 'millisecond') : null,
    });

    if (pagination?.page != null) {
      this.currentPage = pagination.page;
    }

    if (pagination?.pageSize != null) {
      this.pageSize = pagination.pageSize;
    }
  });

  constructor(@Inject(TableFiltersSourceBase) private filterSource: TableFiltersSourceBase<unknown>) {
    this.filteredColumns$ = this.filterForm.valueChanges.pipe(
      startWith(null),
      map((column: string) => this.autocompleteFilter(column))
    );
  }

  private autocompleteFilter(value: string) {
    if (!value) return this.filterOptions?.filter((col) => col !== 'select');
    let filterValue = value.toLowerCase().trimStart();
    const filterIsNegated = filterValue.length > 0 && filterValue[0] === '-';
    filterValue = filterIsNegated ? filterValue.slice(1) : filterValue;
    return this.filterOptions?.filter((col) => {
      const columnIncludesFilter = col.toLowerCase().includes(filterValue) && col !== 'select';
      if (filterIsNegated) {
        return (
          columnIncludesFilter &&
          (!this.negatableFilterOptions || this.negatableFilterOptions.findIndex((v) => v === col) !== -1)
        );
      }
      return columnIncludesFilter;
    });
  }

  async pageChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.filterDiv.nativeElement.scrollIntoView({ behavior: 'instant', block: 'start' });
    await this.filterSource.setPagination(event.pageIndex, event.pageSize);
  }

  async resetPaging() {
    this.currentPage = 0;
    await this.filterSource.setPagination(0, this.pageSize);
  }

  ngOnInit(): void {
    if (!this.pageSize)
      this.pageSize = this.pageSizeOptions && this.pageSizeOptions.length > 0 ? this.pageSizeOptions[0] : 25;
  }

  ngOnDestroy(): void {
    this.filterSourceSub.unsubscribe();
  }

  async removeFilter(filter: string) {
    const index = this.filters.indexOf(filter);
    if (index === -1) return;

    this.filters.splice(index, 1);
    await this.filterSource.setFilters(this.filters.map((x) => x));
    this.resetPaging();
  }

  async addFilter(event: MatChipInputEvent) {
    const option = this.autocomplete.options.find((x) => x.active);
    let value = option ? option.viewValue.trim() : event.value;
    if (event.value.length > 0 && event.value[0] === '-' && value[0] !== '-') value = '-' + value;

    await this.addComplexFilter(value);
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.addComplexFilter(event.option.viewValue);
  }

  private async addComplexFilter(value: string) {
    if (value?.includes(':')) {
      // filter is ready
      // More filter options could be treated here
      // if regex are ever supported
      this.filters.push(value);
      await this.filterSource.setFilters(this.filters.map((x) => x));
      this.resetPaging();

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

  async fulltextSearchChange(value: string[]) {
    this.filters = value;
    await this.filterSource.setFilters(this.filters.map((x) => x));
    this.resetPaging();
  }

  private refocusMatChipInput() {
    this.filterInput.nativeElement.focus();
    this.filterInput.nativeElement.selectionStart = 100000;
    this.filterInput.nativeElement.selectionEnd = 100000;
  }

  clearDates() {
    this.dateRange.reset();
    this.filterSource.setDates(undefined);
  }
}
