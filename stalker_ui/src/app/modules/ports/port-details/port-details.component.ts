import { Component, Input } from '@angular/core';
import { Port } from '../../../shared/types/ports/port.interface';

@Component({
  selector: 'port-details',
  templateUrl: 'port-details.component.html',
  styleUrls: ['./port-details.component.scss'],
})
export class PortDetailsComponent {
  @Input() port: Port | null = null;
}
