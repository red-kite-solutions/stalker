import { Component, Input } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CustomFinding } from '../../../shared/types/finding/finding.type';

@Component({
  selector: 'finding',
  templateUrl: 'finding.component.html',
  styleUrls: ['./finding.component.scss'],
})
export class FindingComponent {
  @Input() finding: CustomFinding | null = null;

  constructor(private toastr: ToastrService) {}

  public copyJsonToClipboard() {
    navigator.clipboard.writeText(JSON.stringify(this.finding, undefined, 2));
    this.toastr.success(
      $localize`:Finding copied to clipboard|Finding copied to clipboard:Finding copied to clipboard`
    );
  }
}
