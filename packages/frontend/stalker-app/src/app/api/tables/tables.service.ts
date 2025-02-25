import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ViewSummary as TableSummary } from '../../shared/types/tables/table-summary.type';
import { Table } from '../../shared/types/tables/table.type';

@Injectable({
  providedIn: 'root',
})
export class TablesService {
  public getTables(): Observable<TableSummary[]> {
    return of([
      {
        id: '1',
        isPinned: true,
        name: 'DNS Health',
        icon: 'ecg_heart',
      },
      {
        id: '2',
        isPinned: false,
        name: 'My second view',
        icon: 'counter_2',
      },
      {
        id: '3',
        isPinned: false,
        name: 'My third view',
        icon: 'counter_3',
      },
    ]);
  }

  public getTable(id: string): Observable<Table> {
    return of({
      id: '1',
      icon: 'heart',
      isPinned: true,
      name: 'DNS Health',
      resource: 'domains',
      fields: [
        {
          id: 'mx',
          findingFieldKey: '',
          findingKey: '',
          name: 'MX',
        },
        {
          id: 'spf',
          findingFieldKey: '',
          findingKey: '',
          name: 'SPF',
        },
        {
          id: 'dkim',
          findingFieldKey: '',
          findingKey: '',
          name: 'DKIM',
        },
        {
          id: 'dmarc',
          findingFieldKey: '',
          findingKey: '',
          name: 'DMARC',
        },
        {
          id: 'rep',
          findingFieldKey: '',
          findingKey: '',
          name: 'Réputation',
        },
      ],
    } as Table);
  }
}
