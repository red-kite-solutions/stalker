import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { JobSource } from '../../../shared/types/jobs/job-source.type';

@Component({
  selector: 'job-source',
  standalone: true,
  imports: [CommonModule, MatIconModule, AvatarComponent, MatTooltipModule],
  template: `<div class="tw-flex tw-items-center">
    @if (!source) {
      <mat-icon matTooltip="Custom" i18n-matTooltip="Custom|Custom element" class="material-symbols-outlined-filled"
        >coffee</mat-icon
      >
    } @else {
      <a (click)="$event.stopPropagation()" [href]="source.repoUrl">
        <avatar
          [matTooltip]="source.repoUrl"
          [matTooltipShowDelay]="500"
          i18n-matTooltip="Stalker|Stalker, the application's name"
          class="tw-block tw-w-8 tw-h-8"
          [src]="source.avatarUrl"
        ></avatar>
      </a>
    }
  </div>`,
})
export class JobSourceComponent {
  @Input() source!: JobSource | undefined;
}
