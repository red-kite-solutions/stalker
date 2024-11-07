import { Injectable } from '@angular/core';
import { DateRange } from '@angular/material/datepicker';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { debounceTime, map, Observable, shareReplay } from 'rxjs';

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
  private readonly START_DATE_KEY = 'start';
  private readonly END_DATE_KEY = 'end';
  private readonly PAGE_SIZE_KEY = 'psize';
  private readonly PAGE_KEY = 'p';

  public filters$: Observable<TableFilters & T> = this.route.queryParamMap.pipe(
    map((queryParams) => this.extractFilters(queryParams)),
    debounceTime(100),
    shareReplay(1)
  );

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  public async setFilters(filters: string[]) {
    await this.setValues({
      [this.FILTERS_KEY]: filters?.length ? filters : null,
    });
  }

  public async setDates(dateRange: DateRange<Date> | undefined) {
    await this.setValues({
      [this.START_DATE_KEY]: dateRange?.start?.toISOString(),
      [this.END_DATE_KEY]: dateRange?.end?.toISOString(),
    });
  }

  public async setPagination(page: number, pageSize: number) {
    await this.setValues({
      [this.PAGE_KEY]: page,
      [this.PAGE_SIZE_KEY]: pageSize,
    });
  }

  protected async setValues(values: { [key: string]: unknown }) {
    await this.router.navigate([], {
      queryParams: values,
      queryParamsHandling: 'merge',
      relativeTo: this.route,
    });
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

    const filters = params.getAll(this.FILTERS_KEY);
    tableFilters.filters = filters ?? [];

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

  protected abstract extractExtraFilters(params: ParamMap): T;

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
}
