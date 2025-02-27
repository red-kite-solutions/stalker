import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomFindingField } from '../../../shared/types/finding/finding.type';
import { TableField } from '../../../shared/types/tables/table.type';

@Component({
  standalone: true,
  imports: [MatIconModule],
  selector: 'rk-table-cell-boolean',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="tw-max-w-[50px]">
    @if (isTrue === true) {
      <mat-icon>check</mat-icon>
    } @else if (isTrue === false) {
      <mat-icon>close</mat-icon>
    }
  </div>`,
})
export class TableCellBooleanComponent {
  @Input() tableFixeld: TableField | undefined = undefined;
  @Input() findingFields: CustomFindingField[] | undefined = undefined;

  get isTrue() {
    if (!this.findingFields) return undefined;

    return this.findingFields.every((x) => x.data?.toLowerCase() === 'True');
  }
}
