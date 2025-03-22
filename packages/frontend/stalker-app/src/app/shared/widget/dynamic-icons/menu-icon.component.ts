import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ElementMenuItems {
  label: string;
  icon: string;
  action: () => Promise<unknown> | void;
  hidden?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

@Component({
  standalone: true,
  selector: 'app-menu-icon',
  template: `
    @if (menuFactory != null) {
      <button mat-icon-button [matMenuTriggerFor]="menu">
        @if (orientation === 'vertical') {
          <mat-icon>more_vert</mat-icon>
        } @else {
          <mat-icon>more_horiz</mat-icon>
        }
      </button>

      <mat-menu #menu="matMenu">
        @for (menuItem of menuFactory(item); track $index) {
          @if (!menuItem.hidden) {
            <button
              mat-menu-item
              (click)="menuItem.action()"
              [disabled]="menuItem.disabled === true"
              [matTooltip]="menuItem.tooltip || ''"
            >
              @if (menuItem.icon) {
                <mat-icon>{{ menuItem.icon }}</mat-icon>
              }
              {{ menuItem.label }}
            </button>
          }
        }
      </mat-menu>
    }
  `,
  styles: [``],
  imports: [MatIconModule, MatMenuModule, MatTooltipModule],
})
export class MenuIconComponent {
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() item!: any;
  @Input() menuFactory?: (element: any) => ElementMenuItems[];
}
