import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-spinner-button',
  template: `<button
    mat-stroked-button
    class="tw-w-full"
    type="button"
    [color]="buttonColor"
    [disabled]="loadingState || disabled"
  >
    <span class="tw-flex tw-gap-2 tw-items-center">
      @if (loadingState) {
        <mat-spinner [diameter]="16" [color]="spinnerColor"></mat-spinner>
      }

      <span><ng-content></ng-content></span>
    </span>
  </button>`,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  styles: `
    :host {
      pointer-events: none;
    }

    :host button span {
      pointer-events: none;
    }

    button {
      pointer-events: auto;
    }
  `,
})
export class SpinnerButtonComponent {
  @Input() label = '';
  @Input() buttonColor: 'primary' | 'accent' | 'warn' | undefined = undefined;
  @Input() spinnerColor = 'primary';
  @Input() loadingState: boolean | null = false;
  @Input() disabled = false;
}
