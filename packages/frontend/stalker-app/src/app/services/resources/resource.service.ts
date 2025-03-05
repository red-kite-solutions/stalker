import { DateRange } from '@angular/material/datepicker';
import { Observable } from 'rxjs';
import { IdentifiedElement } from '../../shared/types/identified-element.type';
import { Page } from '../../shared/types/page.type';

export interface ResourceService<TResource extends IdentifiedElement> {
  getPage(
    page: number,
    pageSize: number,
    filters: any,
    firstSeenDateRange: DateRange<Date>
  ): Observable<Page<TResource>>;
}
