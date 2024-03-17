import { Component, Input } from '@angular/core';
import { CustomFinding } from '../../../shared/types/finding/finding.type';

@Component({
  selector: 'finding',
  templateUrl: 'finding.component.html',
  styleUrls: ['./finding.component.scss'],
})
export class FindingComponent {
  @Input() finding: CustomFinding | null = null;
}
