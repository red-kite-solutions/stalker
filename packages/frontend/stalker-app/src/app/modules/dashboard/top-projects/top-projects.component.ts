import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { ProjectsService } from 'src/app/api/projects/projects.service';
import { ProjectAvatarComponent } from 'src/app/shared/components/project-avatar/project-avatar.component';

@Component({
  standalone: true,
  selector: 'top-projects',
  template: `<span class="metric-title" i18n="Projects|Projects list">Projects</span>
    <mat-list class="metric-list">
      @for (project of projects$ | async; track project) {
        <mat-list-item>
          <span class="project">
            <project-avatar [project]="project"></project-avatar>
            <a class="metric-list-item" [routerLink]="['projects', project._id]">{{ project.name }}</a>
          </span>
        </mat-list-item>
      }
    </mat-list>`,
  styleUrls: ['../metric-styling.scss', './top-projects.component.scss'],
  imports: [CommonModule, ProjectAvatarComponent, MatListModule, RouterModule],
})
export class TopProjects {
  public projects$ = this.projectsService.getAll().pipe(map((x) => x.slice(0, 6)));

  constructor(private projectsService: ProjectsService) {}
}
