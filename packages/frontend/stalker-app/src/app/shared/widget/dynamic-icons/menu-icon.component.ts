import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ElementMenuItems } from '../filtered-paginated-table/filtered-paginated-table.component';

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
            <button mat-menu-item (click)="menuItem.action()">
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
  imports: [MatIconModule, MatMenuModule],
})
export class MenuIconComponent {
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';
  @Input() item!: any;
  @Input() menuFactory?: (element: any) => ElementMenuItems[];
}