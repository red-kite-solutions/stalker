import { Component, Input } from '@angular/core';
import { Finding } from '../../../shared/types/finding/finding.type';

@Component({
  selector: 'finding',
  templateUrl: 'finding.component.html',
  styleUrls: ['./finding.component.scss'],
})
export class FindingComponent {
  @Input() finding: Finding | null = null;
}
