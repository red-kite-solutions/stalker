import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { PreviousRouteService } from '../../../services/previous-route.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  standalone: true,
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, BreadcrumbComponent, RouterModule, MatButtonModule],
  styles: [
    `
      :host {
        height: 64px;
        display: flex;
        align-content: center;
        flex-wrap: wrap;
      }

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
    @if (backRoute) {
      <a
        type="button"
        mat-icon-button
        [routerLink]="(previousRouteService.previousRoute$ | async) || backRoute"
        (click)="back($event)"
      >
        <mat-icon
          style="
          font-variation-settings:
          'FILL' 1,
          'wght' 400
          "
          >arrow_back</mat-icon
        >
      </a>
    }

    <app-breadcrumb [parts]="parts"></app-breadcrumb>
  </h1>`,
})
export class AppHeaderComponent {
  @Input() public parts: string[] = [];
  @Input() public backRoute: unknown[] | undefined = ['..'];

  constructor(
    public previousRouteService: PreviousRouteService,
    public location: Location
  ) {}

  public back(event: MouseEvent) {
    if (event.button === 0) {
      event.preventDefault(); // Prevent the default behavior of `<a>` if it's a left-click
      this.location.back();
    }
  }
}
