import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { SpinnerButtonComponent } from './spinner-button.component';

@Component({
  standalone: true,
  selector: 'app-saving-button',
  template: `@if (canSave) {
      <app-spinner-button [loadingState]="isSaving" (click)="save.next(null)">
        @if (!isSaving) {
          <span i18n="Save changes|Save">Save</span>
        } @else {
          <span i18n="Saving|Saving">Saving</span>
        }
      </app-spinner-button>
    }

    @if (hasBeenSaved && !canSave) {
      <mat-icon class="saved-check tw-text-green-600 tw-text-[16px] tw-mt-[20px]">check_circle</mat-icon>
    }`,
  styles: [
    `
      @keyframes example {
        0% {
          opacity: 1;
        }
        75% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }

      .saved-check {
        animation-name: example;
        animation-duration: 2s;
        opacity: 0;
      }
    `,
  ],
  imports: [CommonModule, SpinnerButtonComponent, MatIconModule],
})
export class SavingButtonComponent {
  @Input() canSave = false;
  @Input() isSaving = false;
  @Input() hasBeenSaved = false;
  @Output() save = new EventEmitter();
}
