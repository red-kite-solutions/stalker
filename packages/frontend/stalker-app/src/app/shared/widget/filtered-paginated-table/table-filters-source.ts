import { Inject, Injectable, Optional } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { ActivatedRoute, NavigationEnd, ParamMap, Router } from '@angular/router';
import { concatMap, debounceTime, EMPTY, filter, map, Observable, of, shareReplay, startWith } from 'rxjs';

export const TABLE_FILTERS_SOURCE_INITAL_FILTERS = 'TABLE_FILTERS_SOURCE_INITAL_FILTERS';

export interface TableFilters {
  dateRange?: DateRange<Date>;
  filters: string[];
  pagination?: {
    page?: number;
    pageSize?: number;
  };
}

@Injectable()
export abstract class TableFiltersSourceBase<T> {
  private readonly FILTERS_KEY = 'f';
  private readonly FILTERS_SEPARATOR = '+';
  private readonly START_DATE_KEY = 'start';
  private readonly END_DATE_KEY = 'end';
  private readonly PAGE_SIZE_KEY = 'psize';
  private readonly PAGE_KEY = 'p';

  private params$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => this.route.snapshot.queryParamMap),
    startWith(this.route.snapshot.queryParamMap)
  );

  public filters$: Observable<TableFilters & T> = this.params$.pipe(
    map((queryParams) => this.extractFilters(queryParams)),
    concatMap((filters, index) => {
      if (index > 0) return of(filters);
      if (!this.isEmpty(filters)) return of(filters);

      return of(this.initializeFilters()).pipe(concatMap(() => EMPTY));
    }),
    shareReplay(1)
  );

  public debouncedFilters$ = this.filters$.pipe(debounceTime(250));

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Optional() @Inject(TABLE_FILTERS_SOURCE_INITAL_FILTERS) private initialFilters: TableFilters & T
  ) {}

  public async setFilters(filters: string[]) {
    await this.setValues(this.formatFilters(filters));
  }

  public async setDates(dateRange: DateRange<Date> | undefined) {
    await this.setValues(this.formatDates(dateRange));
  }

  public async setPagination(page: number, pageSize: number) {
    await this.setValues(this.formatPagination(page, pageSize));
  }

  protected async setValues(values: { [key: string]: unknown }) {
    console.log(values);
    await this.router.navigate([], {
      queryParams: values,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    });
  }

  public formatFilters(filters: string[]) {
    const separator = this.FILTERS_SEPARATOR;
    return {
      [this.FILTERS_KEY]: filters?.length
        ? filters
            .map((x) => x.replace(new RegExp(`\\${separator}`, 'g'), encodeURIComponent(separator)))
            .join(separator)
        : null,
    };
  }

  public formatDates(dateRange: DateRange<Date> | undefined) {
    return {
      [this.START_DATE_KEY]: dateRange?.start?.toISOString(),
      [this.END_DATE_KEY]: dateRange?.end?.toISOString(),
    };
  }

  public formatPagination(page: number, pageSize: number) {
    return {
      [this.PAGE_KEY]: page,
      [this.PAGE_SIZE_KEY]: pageSize,
    };
  }

  private extractFilters(params: ParamMap): TableFilters & T {
    return {
      ...this.extractBaseFilters(params),
      ...this.extractExtraFilters(params),
    };
  }

  private extractBaseFilters(params: ParamMap): TableFilters {
    const tableFilters: TableFilters = {
      filters: [],
    };

    const filters = params.get(this.FILTERS_KEY);
    tableFilters.filters = filters ? filters.split(this.FILTERS_SEPARATOR).map((x) => decodeURIComponent(x)) : [];

    const start = this.readDate(params.get(this.START_DATE_KEY));
    const end = this.readDate(params.get(this.END_DATE_KEY));
    tableFilters.dateRange = new DateRange(start || null, end || null);

    const page = this.readNumber(params.get(this.PAGE_KEY));
    const pageSize = this.readNumber(params.get(this.PAGE_SIZE_KEY));
    if (page || pageSize) {
      tableFilters.pagination = {
        page,
        pageSize,
      };
    }

    return tableFilters;
  }

  private isEmpty({ filters, dateRange, pagination, ...extra }: TableFilters & T) {
    if (filters?.length) return false;
    if (dateRange?.start || dateRange?.end) return false;
    if (pagination?.page != null || pagination?.pageSize) return false;

    return Object.values(extra).every((value) => value == null);
  }

  private async initializeFilters(): Promise<void> {
    if (!this.initialFilters) return;

    let initialFilters = {
      ...this.formatFilters(this.initialFilters.filters),
      ...this.formatDates(this.initialFilters.dateRange),
      ...this.formatPagination(
        this.initialFilters?.pagination?.page ?? 0,
        this.initialFilters?.pagination?.pageSize ?? 25
      ),
      ...this.formatExtraInitialFilters(this.initialFilters),
    };

    await this.setValues(initialFilters);
  }

  protected abstract extractExtraFilters(params: ParamMap): T;

  protected abstract formatExtraInitialFilters(input: T): Record<string, unknown>;

  protected readDate(stringDate: string | null) {
    if (stringDate == null) return;

    const date = new Date(stringDate);
    if (isNaN(date?.getTime())) return;

    return date;
  }

  protected readNumber(stringNumber: string | null) {
    if (stringNumber == null) return;

    const n = +stringNumber;
    if (isNaN(n)) return;

    return n;
  }
}

@Injectable()
export class TableFiltersSource extends TableFiltersSourceBase<void> {
  protected override extractExtraFilters(params: ParamMap): void {
    return;
  }

  protected override formatExtraInitialFilters(input: void): Record<string, unknown> {
    return {};
  }
}
