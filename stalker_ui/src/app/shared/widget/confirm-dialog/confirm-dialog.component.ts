import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title?: string;
  text?: string;
  primaryButtonText?: string;
  dangerButtonText?: string;
  listElements?: string[];
  onPrimaryButtonClick?: Function;
  onDangerButtonClick?: Function;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  @Input()
  public readonly maxListLength: number = 15;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {
    if (data.listElements && data.listElements.length > this.maxListLength + 1) {
      const restCount = data.listElements.length - this.maxListLength;
      const total = data.listElements.length;
      data.listElements = data.listElements.slice(0, this.maxListLength);
      data.listElements.push(
        $localize`:list shortener|A list of several items is shortened using this phrase:and ${restCount} other (${total} total)`
      );
    }
  }

  primaryClick() {
    if (this.data.onPrimaryButtonClick) {
      this.data.onPrimaryButtonClick();
    }
  }

  dangerClick() {
    if (this.data.onDangerButtonClick) {
      this.data.onDangerButtonClick();
    }
  }
}
