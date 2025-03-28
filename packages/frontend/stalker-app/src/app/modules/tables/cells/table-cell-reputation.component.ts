import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CustomFindingField } from '../../../shared/types/finding/finding.type';
import { TableField } from '../../../shared/types/tables/table.type';
import { PillTagComponent } from '../../../shared/widget/pill-tag/pill-tag.component';

@Component({
  standalone: true,
  imports: [MatIconModule, PillTagComponent],
  selector: 'rk-table-cell-reputation',
  template: `<div class="tw-max-w-[50px]">
    @if (findingFields?.[0]?.data === 'High risk') {
      <app-pill-tag [color]="'#A52330'">{{ findingFields?.[0]?.data }}</app-pill-tag>
    } @else if (findingFields?.[0]?.data === 'Low risk') {
      <app-pill-tag [color]="'#9CA523'">{{ findingFields?.[0]?.data }}</app-pill-tag>
    } @else if (findingFields?.[0]?.data === 'Safe') {
      <app-pill-tag [color]="'#55A523'">{{ findingFields?.[0]?.data }}</app-pill-tag>
    }
  </div>`,
})
export class TableCellReputationComponent {
  @Input() tableFixeld: TableField | undefined = undefined;
  @Input() findingFields: CustomFindingField[] | undefined = undefined;
}
