import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Project } from '../../types/project/project.interface';
import { ProjectAvatarComponent } from '../project-avatar/project-avatar.component';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'project-cell',
  styleUrls: ['./project-cell.component.scss'],
  template: `
    <span class="project-cell">
      <project-avatar [project]="project"></project-avatar>
      <span>{{ project?.name }}</span>
    </span>
  `,
  imports: [ProjectAvatarComponent],
})
export class ProjectCellComponent {
  @Input() project: Pick<Project, 'logo' | 'name'> | undefined;
}
