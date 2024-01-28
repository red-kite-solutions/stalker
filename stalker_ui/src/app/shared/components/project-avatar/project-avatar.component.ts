import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Project } from '../../types/project/project.interface';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'project-avatar',
  styleUrls: ['./project-avatar.component.scss'],
  template: `@if (project != null) {
    <avatar [src]="project.logo" [name]="project.name"></avatar>
  }`,
  imports: [AvatarComponent],
})
export class ProjectAvatarComponent {
  @Input() project: Pick<Project, 'logo' | 'name'> | undefined;
}
