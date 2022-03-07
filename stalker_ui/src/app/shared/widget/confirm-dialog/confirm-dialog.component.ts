import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, throwMatDialogContentAlreadyAttachedError } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title?: string;
  text?: string;
  positiveButtonText?: string;
  negativeButtonText?: string;
  listElements?: string[];
  onPositiveButtonClick?: Function;
  onNegativeButtonClick?: Function;
}


@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit {
  public readonly maxListLength: number = 15;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {
    if (data.listElements && data.listElements.length > this.maxListLength) {
      data.listElements = data.listElements.slice(0, this.maxListLength);
      data.listElements.push("...");
    }
  }

  ngOnInit(): void {

  }

  positiveClick() {
    if (this.data.onPositiveButtonClick) {
      this.data.onPositiveButtonClick();
    }
  }

  negativeClick() {
    if (this.data.onNegativeButtonClick) {
      this.data.onNegativeButtonClick();
    }
  }

}
