import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-spinner-button',
  template: `<button mat-stroked-button class="tw-w-full" type="button" [disabled]="loadingState">
    <span class="tw-flex tw-gap-2 tw-items-center">
      @if (loadingState) {
        <mat-spinner [diameter]="16" [color]="spinnerColor"></mat-spinner>
      }

      <span><ng-content></ng-content></span>
    </span>
  </button>`,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
})
export class SpinnerButtonComponent {
  @Input() label = '';
  @Input() buttonColor = 'primary';
  @Input() spinnerColor = 'primary';
  @Input() loadingState = false;
}
