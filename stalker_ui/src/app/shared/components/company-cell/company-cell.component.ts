import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Company } from '../../types/company/company.interface';
import { CompanyAvatarComponent } from '../company-avatar/company-avatar.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'company-cell',
  styleUrls: ['./company-cell.component.scss'],
  template: `
    <span class="company-cell">
      <company-avatar [company]="company"></company-avatar>
      <span>{{ company?.name }}</span>
    </span>
  `,
  imports: [CompanyAvatarComponent],
})
export class CompanyCellComponent {
  @Input() company: Pick<Company, 'logo' | 'name'> | undefined;
}
