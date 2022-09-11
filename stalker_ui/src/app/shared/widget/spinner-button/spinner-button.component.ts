import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner-button',
  templateUrl: './spinner-button.component.html',
  styleUrls: ['./spinner-button.component.scss'],
})
export class SpinnerButtonComponent {
  @Input() label = '';
  @Input() buttonColor = 'primary';
  @Input() spinnerColor = 'accent';
  @Input() loadingState = false;
}
