import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title?: string;
  text?: string;
  primaryButtonText?: string;
  dangerButtonText?: string;
  listElements?: string[];
  enableCancelButton?: boolean;
  onPrimaryButtonClick?: () => unknown | (() => Promise<unknown>);
  onDangerButtonClick?: () => unknown | (() => Promise<unknown>);
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
  @Input()
  public readonly maxListLength: number = 15;

  public primaryLoading = false;
  public dangerLoading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    public dialog: MatDialog
  ) {
    if (data.listElements && data.listElements.length > this.maxListLength + 1) {
      const restCount = data.listElements.length - this.maxListLength;
      const total = data.listElements.length;
      data.listElements = data.listElements.slice(0, this.maxListLength);
      data.listElements.push(
        $localize`:list shortener|A list of several items is shortened using this phrase:and ${restCount} other (${total} total)`
      );
    }
  }

  public async primaryClick() {
    this.primaryLoading = true;
    try {
      if (this.data.onPrimaryButtonClick) {
        await this.data.onPrimaryButtonClick();
      }
    } finally {
      this.primaryLoading = false;
    }
  }

  public async dangerClick() {
    this.dangerLoading = true;
    try {
      if (this.data.onDangerButtonClick) {
        await this.data.onDangerButtonClick();
      }
    } finally {
      this.dangerLoading = false;
    }
  }

  public cancel() {
    this.dialog.closeAll();
  }
}
