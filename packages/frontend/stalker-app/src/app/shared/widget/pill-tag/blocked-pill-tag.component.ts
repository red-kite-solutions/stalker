import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { PillTagComponent } from './pill-tag.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-blocked-pill-tag',
  imports: [SharedModule, PillTagComponent],
  template: `
    <app-pill-tag color="#bbbbbb" i18n="Blocked|Indicates a blocked state for this item.">Blocked</app-pill-tag>
  `,
})
export class BlockedPillTagComponent {}
