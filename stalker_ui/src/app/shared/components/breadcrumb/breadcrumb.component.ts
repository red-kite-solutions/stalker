
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  styles: ['.dimmed { opacity: 0.6; }'],
  template: `@for (part of nonBlankParts; track part; let last = $last) {
  <span>{{ part }}</span
    >@if (!last) {
    <span class="dimmed"> / </span>
  }
}`,
})
export class BreadcrumbComponent {
  @Input() public parts: string[] = [];

  public get nonBlankParts() {
    return this.parts.filter((x) => x && x != '');
  }
}
