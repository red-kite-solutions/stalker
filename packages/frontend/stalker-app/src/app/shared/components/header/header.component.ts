import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, Router } from '@angular/router';
import { map, Observable, Subscription } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { ThemeService } from '../../../services/theme.service';
import {
  getGlobalProjectFilter,
  globalProjectFilter$,
  setGlobalProjectFilter,
} from '../../../utils/global-project-filter';
import { SharedModule } from '../../shared.module';
import { ProjectSummary } from '../../types/project/project.summary';
import { SelectItem } from '../../widget/text-select-menu/text-select-menu.component';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [
    MatToolbarModule,
    MatIconModule,
    AvatarComponent,
    SharedModule,
    CommonModule,
    MatMenuModule,
    MatButtonModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  public filterProjects: string = $localize`:Filter projects|Filter projects:Filter projects`;
  public emptyProjects: string = $localize`:No projects yet|List of projects is empty:No projects yet`;

  @Output()
  toggleSideBarEvent: EventEmitter<any> = new EventEmitter();

  @Input()
  public showRouting = true;

  public currentLanguageLocale = '';
  public email = '';
  public selectedProject: SelectItem | undefined;
  public externalFilterSet$!: Subscription;

  public readonly languages: {
    locale: string;
    language: string;
  }[] = [
    {
      locale: 'en',
      language: 'English',
    },
    {
      locale: 'fr',
      language: 'Français',
    },
  ];

  public projects$: Observable<(SelectItem & { id: string })[]> | undefined = undefined;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    public themeService: ThemeService
  ) {
    this.email = this.authService.email;
    this.currentLanguageLocale = window.location.pathname.split('/')[1];
    this.refreshProjects();
  }

  ngOnInit(): void {
    if (this.showRouting) {
      const globalProjectFilter = getGlobalProjectFilter();
      if (globalProjectFilter) {
        this.selectedProject = { ...globalProjectFilter, isSelected: true };
      }

      this.externalFilterSet$ = globalProjectFilter$.subscribe((filter) => {
        this.selectedProject = filter ? { isSelected: true, text: filter.text } : undefined;
        this.selectProject(this.selectedProject, false);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.externalFilterSet$) this.externalFilterSet$.unsubscribe();
  }

  toggleSideBar() {
    this.toggleSideBarEvent.emit();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  selectLanguage(locale: string) {
    if (locale === this.currentLanguageLocale) return;

    const r = new RegExp(`^/${this.currentLanguageLocale}/`);

    window.location.pathname = window.location.pathname.replace(r, `/${locale}/`);
  }

  refreshProjects() {
    this.projects$ = this.projectsService.getAllSummaries().pipe(
      map((projects) =>
        projects.map((x) => ({
          ...x,
          isSelected: false,
          text: x.name,
        }))
      )
    );
  }

  selectProject(project: SelectItem | undefined, emit = true) {
    this.selectedProject = project;
    if (emit) setGlobalProjectFilter(project as SelectItem & ProjectSummary);
  }

  clearProject() {
    this.selectProject(undefined);
  }
}
