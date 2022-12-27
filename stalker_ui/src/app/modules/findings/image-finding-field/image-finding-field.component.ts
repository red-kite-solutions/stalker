import { Component, Input } from '@angular/core';
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
}
