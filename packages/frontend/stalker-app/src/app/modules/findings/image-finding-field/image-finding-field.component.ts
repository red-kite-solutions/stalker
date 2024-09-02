import { Component, Input, TemplateRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CustomFindingField, CustomFindingImageField } from '../../../shared/types/finding/finding.type';

@Component({
  selector: 'image-finding-field',
  templateUrl: 'image-finding-field.component.html',
  styleUrls: ['./image-finding-field.component.scss'],
})
export class ImageFindingFieldComponent {
  public _data: CustomFindingImageField | null = null;
  @Input() public set data(value: CustomFindingField | null) {
    if (value?.type !== 'image') {
      this._data = null;
      return;
    }

    this._data = value;
  }

  public zoom(template: TemplateRef<any>) {
    this.dialog.open(template);
  }

  constructor(public dialog: MatDialog) {}
}
