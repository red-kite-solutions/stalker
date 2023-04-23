import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styles: ['.dimmed { opacity: 0.6; }'],
  template: `<ng-container *ngFor="let part of parts; let last = last">
    <span>{{ part }}</span
    ><span *ngIf="!last" class="dimmed"> / </span>
  </ng-container>`,
})
export class BreadcrumbComponent {
  @Input() public parts: string[] = [];
}
