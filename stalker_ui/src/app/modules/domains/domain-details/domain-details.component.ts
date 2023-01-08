import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Company } from '../../../shared/types/company/company.interface';
import { Domain } from '../../../shared/types/domain/domain.interface';

@Component({
  selector: 'domain-details',
  templateUrl: 'domain-details.component.html',
  styleUrls: ['./domain-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DomainDetailsComponent {
  @Input() domain: Domain | null = null;

  @Input() company: Company | null = null;
}
