import { Component, Input } from '@angular/core';
import { Port } from '../../../shared/types/host/host.interface';

@Component({
  selector: 'port-details',
  templateUrl: 'port-details.component.html',
  styleUrls: ['./port-details.component.scss'],
})
export class PortDetailsComponent {
  @Input() port: Port | null = null;
}
