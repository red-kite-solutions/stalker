import { Component, Input } from '@angular/core';
import { LegacyMenuPositionX as MenuPositionX } from '@angular/material/legacy-menu';

@Component({
  selector: 'app-text-menu',
  templateUrl: './text-menu.component.html',
  styleUrls: ['./text-menu.component.scss'],
})
export class TextMenuComponent {
  @Input() buttonText = $localize`:Click Here|:Click Here`;
  @Input() iconName = '';
  @Input() iconOutlined = true;
  @Input() xPosition: MenuPositionX = 'after';
}
