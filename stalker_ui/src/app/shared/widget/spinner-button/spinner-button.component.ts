import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner-button',
  template: `<button type="button" mat-flat-button [color]="buttonColor" [disabled]="loadingState">
    <span class="tw-flex tw-gap-2 tw-items-center">
      @if (loadingState) {
        <mat-spinner [diameter]="16" [color]="spinnerColor"></mat-spinner>
      }

      <span>{{ label }}</span>
    </span>
  </button>`,
})
export class SpinnerButtonComponent {
  @Input() label = '';
  @Input() buttonColor = 'primary';
  @Input() spinnerColor = 'accent';
  @Input() loadingState = false;
}
