import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Company } from '../../../shared/types/company/company.interface';
import { Host } from '../../../shared/types/host/host.interface';

@Component({
  selector: 'host-details',
  templateUrl: 'host-details.component.html',
  styleUrls: ['./host-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostDetailsComponent {
  @Input() host: Host | null = null;

  @Input() company: Company | null = null;
}
