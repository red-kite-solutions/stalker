import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CustomFindingField } from '../../../shared/types/finding/finding.type';
import { TableField } from '../../../shared/types/tables/table.type';
import { TableCellBooleanComponent } from './table-cell-boolean.component';
import { TableCellReputationComponent } from './table-cell-reputation.component';

@Component({
  standalone: true,
  imports: [TableCellBooleanComponent, TableCellReputationComponent],
  selector: 'rk-table-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="tw-max-w-[220px]">
    @switch (displayType) {
      @case ('text') {
        @for (field of findingFields; track $index) {
          <div>{{ field?.data }}</div>
        }
      }

      @case ('boolean') {
        <rk-table-cell-boolean [findingFields]="findingFields"></rk-table-cell-boolean>
      }

      @case ('reputation') {
        <rk-table-cell-reputation [findingFields]="findingFields"></rk-table-cell-reputation>
      }
    }
  </div>`,
})
export class TableCellComponent {
  @Input() tableField: TableField | undefined = undefined;
  @Input() findingFields: CustomFindingField[] | undefined = [];

  public get displayType() {
    if (!this.tableField) return;

    const { findingKey, findingFieldKey } = this.tableField;
    if (findingKey === 'DnsHealth') {
      if (findingFieldKey === 'mxRecords') return 'text';
      return 'boolean';
    }

    if (findingKey === 'Reputation') {
      if (findingFieldKey === 'reputation') return 'reputation';
    }

    return 'text';
  }
}
