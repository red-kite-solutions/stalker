import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  standalone: true,
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, BreadcrumbComponent, RouterModule, MatButtonModule],
  styles: [
    `
      h1 {
        padding-top: 16px;
        display: flex;
        align-items: center;
      }
    `,
  ],
  template: `<h1>
    <button type="button" mat-icon-button [routerLink]="backRoute">
      <mat-icon class="material-icons-outlined">arrow_back</mat-icon>
    </button>

    <app-breadcrumb [parts]="parts"></app-breadcrumb>
  </h1>`,
})
export class AppHeaderComponent {
  @Input() public parts: string[] = [];
  @Input() public backRoute: unknown[] = ['..'];
}
