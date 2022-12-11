import { Component, Input } from '@angular/core';
import { Finding } from '../../shared/types/finding/finding.type';

@Component({
  selector: 'findings-list',
  templateUrl: 'findings-list.component.html',
  styleUrls: ['./finding-list.component.scss'],
})
export class FindingsListComponent {
  @Input() findings: Finding[] | null = null;
}
