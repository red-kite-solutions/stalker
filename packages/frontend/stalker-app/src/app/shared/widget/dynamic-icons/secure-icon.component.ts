import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  selector: 'app-secure-icon',
  template: `
    <div [matTooltip]="secure ? secureConnectionTooltip : insecureConnectionTooltip" class="secure-icon">
      @if (secure) {
        <mat-icon> lock </mat-icon>
      } @else {
        <mat-icon> no_encryption </mat-icon>
      }
    </div>
  `,
  styles: [
    `
      .secure-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    `,
  ],
  imports: [MatIconModule, MatTooltipModule],
})
export class SecureIconComponent {
  @Input() public secureConnectionTooltip: string =
    $localize`:Connection secure|:Connections to this website are encrypted`;
  @Input() public insecureConnectionTooltip: string =
    $localize`:Connection insecure|:Connections to this website are not encrypted`;
  @Input() public secure!: boolean;
}
