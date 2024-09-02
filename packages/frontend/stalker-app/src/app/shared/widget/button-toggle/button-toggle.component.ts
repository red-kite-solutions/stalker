import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toggle-button',
  template: `
    <mat-button-toggle-group
      name="ingredients"
      aria-label="Ingredients"
      [hideMultipleSelectionIndicator]="hideIndicator"
      multiple
    >
      <mat-button-toggle value="flour">Flour</mat-button-toggle>
      <mat-button-toggle value="eggs">Eggs</mat-button-toggle>
      <mat-button-toggle value="sugar">Sugar</mat-button-toggle>
    </mat-button-toggle-group>
  `,
  imports: [CommonModule, MatButtonModule, MatButtonToggleModule],
})
export class SpinnerButtonComponent {
  @Input() label = '';
  @Input() buttonColor: 'primary' | 'accent' | 'warn' | undefined = undefined;
  @Input() spinnerColor = 'primary';
  @Input() hideIndicator = true;
  @Input() disabled = false;
  @Input() click?: (value: any) => void | Promise<void>;
}
