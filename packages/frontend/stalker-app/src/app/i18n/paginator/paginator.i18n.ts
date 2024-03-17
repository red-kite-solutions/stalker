import { MatPaginatorIntl } from '@angular/material/paginator';

const rangeLabel = (page: number, pageSize: number, length: number) => {
  const low = page * pageSize + 1;
  const high = page * pageSize + pageSize <= length ? page * pageSize + pageSize : length;
  return $localize`:Paginator range|Item numbers and range of the paginator:${low} – ${high} of ${length}`;
};

export function getPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = $localize`:Items per page|Paginator items per page label:Items per page`;
  paginatorIntl.nextPageLabel = $localize`:Next page|Paginator next page label:Next page`;
  paginatorIntl.lastPageLabel = $localize`:Last page|Paginator last page label:Last page`;
  paginatorIntl.previousPageLabel = $localize`:Previous page|Paginator previous page label:Previous page`;
  paginatorIntl.firstPageLabel = $localize`:First page|Paginator first page label:First page`;

  paginatorIntl.getRangeLabel = rangeLabel;
  return paginatorIntl;
}
