import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ViewSummary as TableSummary } from '../../shared/types/tables/table-summary.type';
import { Table } from '../../shared/types/tables/table.type';

@Injectable({
  providedIn: 'root',
})
export class TablesService {
  public getTables(): Observable<TableSummary[]> {
    return of([]);
  }

  public getTable(id: string): Observable<Table> {
    return of(undefined as unknown as Table);
  }
}
