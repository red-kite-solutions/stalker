import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SharedModule } from '../../shared.module';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-disabled-pill-tag',
  imports: [SharedModule],
  template: `
    <app-pill-tag color="#bbbbbb" i18n="Disabled|Indicates a disabled state for this item.">Disabled</app-pill-tag>
  `,
})
export class DisabledPillTagComponent {}
