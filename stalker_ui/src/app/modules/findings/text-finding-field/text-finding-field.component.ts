import { Component, Input } from '@angular/core';
import { FindingField, FindingTextField } from '../../../shared/types/finding/finding.type';

@Component({
  selector: 'text-finding-field',
  templateUrl: 'text-finding-field.component.html',
  styleUrls: ['./text-finding-field.component.scss'],
})
export class TextFindingFieldComponent {
  public _data: FindingTextField | null = null;
  @Input() public set data(value: FindingField | null) {
    if (value?.type !== 'text') {
      this._data = null;
      return;
    }

    this._data = value;
  }
}
