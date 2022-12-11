import { Component, Input } from '@angular/core';
import { FindingField, FindingImageField } from '../../../shared/types/finding/finding.type';

@Component({
  selector: 'image-finding-field',
  templateUrl: 'image-finding-field.component.html',
  styleUrls: ['./image-finding-field.component.scss'],
})
export class ImageFindingFieldComponent {
  public _data: FindingImageField | null = null;
  @Input() public set data(value: FindingField | null) {
    if (value?.type !== 'image') {
      this._data = null;
      return;
    }

    this._data = value;
  }
}
