import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Company } from '../../types/company/company.interface';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'company-avatar',
  styleUrls: ['./company-avatar.component.scss'],
  template: `@if (company != null) {
    <avatar [src]="company.logo" [name]="company.name"></avatar>
  }`,
  imports: [AvatarComponent],
})
export class CompanyAvatarComponent {
  @Input() company: Pick<Company, 'logo' | 'name'> | undefined;
}
