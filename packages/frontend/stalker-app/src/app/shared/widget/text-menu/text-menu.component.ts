import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MenuPositionX } from '@angular/material/menu';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-text-menu',
  templateUrl: './text-menu.component.html',
  styleUrls: ['./text-menu.component.scss'],
  imports: [CommonModule, MatButtonModule, MatMenuModule, MatIconModule],
})
export class TextMenuComponent {
  @Input() buttonText: string | undefined = $localize`:Click Here|:Click Here`;
  @Input() buttonIcon: string | undefined = undefined;
  @Input() iconName = '';
  @Input() xPosition: MenuPositionX = 'after';

  /** Used to determine the menu width. Otherwise, uses the button width. */
  @Input() containerElement: HTMLElement | undefined = undefined;

  @Output() open = new EventEmitter();

  public get width() {
    return this.containerElement?.offsetWidth ?? this.element.nativeElement.offsetWidth;
  }

  constructor(private element: ElementRef) {}
}
