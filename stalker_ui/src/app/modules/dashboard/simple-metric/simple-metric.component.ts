import { Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'simple-metric',
  styleUrls: ['../metric-styling.scss', './simple-metric.component.scss'],
  template: `
    <span class="metric-title">{{ title }}</span>
    <div class="metric-value-container">
      <h1 [style.font-size]="fontWidth">{{ value }}</h1>
    </div>
  `,
})
export class SimpleMetric {
  public readonly type = 'simple';

  @Input() title = '';
  @Input() value?: string | null = '';

  get fontWidth() {
    if (this.value == null) return;
    if (this.value.length <= 3) return '64px';
    if (this.value.length === 4) return '38px';
    if (this.value.length === 5) return '32px';

    return '28px';
  }
}
