import { Component, Input } from '@angular/core';
import { MenuPositionX } from '@angular/material/menu';

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
