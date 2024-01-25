import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  standalone: true,
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, BreadcrumbComponent, RouterModule, MatButtonModule],
  styles: [
    `
      h1 {
        padding-top: 16px;
        padding-bottom: 8px;
        display: flex;
        align-items: center;
        font-weight: 500;
        font-size: 18px;
      }

      app-breadcrumb {
        margin-top: -4px;
      }
    `,
  ],
  template: `<h1>
    <button type="button" mat-icon-button [routerLink]="backRoute">
      <mat-icon
        style="
          font-variation-settings:
            'FILL' 1,
            'wght' 400
        "
        >arrow_back</mat-icon
      >
    </button>

    <app-breadcrumb [parts]="parts"></app-breadcrumb>
  </h1>`,
})
export class AppHeaderComponent {
  @Input() public parts: string[] = [];
  @Input() public backRoute: unknown[] = ['..'];
}
