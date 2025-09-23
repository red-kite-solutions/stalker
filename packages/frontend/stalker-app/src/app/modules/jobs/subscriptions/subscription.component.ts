import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  firstValueFrom,
  map,
  of,
  shareReplay,
  switchMap,
  timer,
} from 'rxjs';
import { parse } from 'yaml';
import { AuthService } from '../../../api/auth/auth.service';
import { allProjectsSubscriptions } from '../../../api/constants';
import { cronSubscriptionKey } from '../../../api/jobs/subscriptions/cron-subscriptions.service';
import { eventSubscriptionKey } from '../../../api/jobs/subscriptions/event-subscriptions.service';
import { SubscriptionService, SubscriptionType } from '../../../api/jobs/subscriptions/subscriptions.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { ThemeService } from '../../../services/theme.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { HasScopesDirective } from '../../../shared/directives/has-scopes.directive';
import { HasUnsavedChanges } from '../../../shared/guards/unsaved-changes-can-deactivate.component';
import { SharedModule } from '../../../shared/shared.module';
import { DataSource } from '../../../shared/types/data-source/data-source.type';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { Subscription } from '../../../shared/types/subscriptions/subscription.type';
import { CodeEditorComponent, CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';
import { DisabledPillTagComponent } from '../../../shared/widget/pill-tag/disabled-pill-tag.component';
import { SavingButtonComponent } from '../../../shared/widget/spinner-button/saving-button.component';
import { TextMenuComponent } from '../../../shared/widget/text-menu/text-menu.component';
import { DataSourceComponent } from '../../data-source/data-source/data-source.component';
import { SubscriptionInteractionService } from './subscription-interaction.service';
import { cronSubscriptionTemplate, eventSubscriptionTemplate } from './subscription-templates';

@Component({
  standalone: true,
  selector: 'app-subscription',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
  imports: [
    AppHeaderComponent,
    CommonModule,
    CodeEditorComponent,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatOptionModule,
    MatIconModule,
    MatPaginatorModule,
    MatMenuModule,
    MatSidenavModule,
    MatTabsModule,
    MatTooltipModule,
    MatCardModule,
    TextMenuComponent,
    PanelSectionModule,
    MatDividerModule,
    SavingButtonComponent,
    DisabledPillTagComponent,
    DataSourceComponent,
    HasScopesDirective,
  ],
})
export class SubscriptionComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  public code = '';
  public originalCode = '';
  public isSaving = false;
  public isInitializing = true;
  public subSource: DataSource | undefined = undefined;
  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );

  public subscription$ = timer(0, 250).pipe(map(() => parse(this.code)));
  private id$ = this.activatedRoute.paramMap.pipe(map((x) => x.get('id')));
  private type$ = this.activatedRoute.queryParamMap.pipe(map((x) => x.get('type') as SubscriptionType));

  /** Used before a subscription is saved. */
  public temporaryIsEnabled$ = new BehaviorSubject(false);
  private refreshIsEnabled$ = new BehaviorSubject(true);
  public isEnabled$ = combineLatest([this.id$, this.type$, this.temporaryIsEnabled$, this.refreshIsEnabled$]).pipe(
    filter(([id]) => id != null),
    switchMap(([id, type, temporaryIsEnabled]) => {
      if (id === 'create') {
        return of({ isEnabled: temporaryIsEnabled });
      } else {
        return this.subscriptionService.get(type, id!);
      }
    }),
    map((x) => x?.isEnabled),
    shareReplay(1)
  );

  public selectedRow: Subscription | undefined;
  public tempSelectedRow: Subscription | undefined;
  public subscriptionTypeContext: string | undefined = undefined;
  public currentSubscriptionId = '';
  public data = new Array<Subscription>();

  public hasBeenSaved = false;
  public hasConfigChanged = false;
  public get canSave() {
    return this.code != this.originalCode || this.hasConfigChanged;
  }

  public subscriptionConfigForm = this.fb.group({
    selectedProject: new FormControl<string>(allProjectsSubscriptions),
  });

  public projects: ProjectSummary[] = [];
  public projects$ = this.projectsService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: ProjectSummary[] = [];
      for (const project of next) {
        comp.push({ id: project._id, name: project.name });
      }
      this.projects = comp;
      return this.projects;
    })
  );

  private formSubscription = this.subscriptionConfigForm.valueChanges.subscribe(() => {
    this.hasConfigChanged = true;
    this.hasUnsavedChanges$.next(true);
  });

  public hasUnsavedChanges$ = new BehaviorSubject(false);

  constructor(
    private toastr: ToastrService,
    private projectsService: ProjectsService,
    private titleService: Title,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private subscriptionInteractor: SubscriptionInteractionService,
    private themeService: ThemeService,
    private authService: AuthService
  ) {
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
  }

  public async forceSave() {
    if (!this.authService.userHasScope('automation:subscriptions:update')) return;
    this.hasConfigChanged = true;
    await this.save();
  }

  public async save() {
    this.isSaving = true;
    this.subscriptionConfigForm.disable();

    let sub: Subscription;
    try {
      sub = parse(this.code);
    } catch {
      this.toastr.error(
        $localize`:Yaml syntax error|There was a syntax error in the user provided yaml:Yaml syntax error`
      );
      this.isSaving = false;
      this.subscriptionConfigForm.enable();
      return;
    }

    let valid = sub.name && sub.job && sub.job.name;
    if (!valid) {
      const invalidSubscription = $localize`:Invalid subscription|Subscription is not in a valid format:Invalid subscription`;
      this.toastr.error(invalidSubscription);
      this.isSaving = false;
      return;
    }

    if (this.subscriptionConfigForm.get('selectedProject')?.value) {
      const cId = this.subscriptionConfigForm.get('selectedProject')?.value;
      sub.projectId = cId ? cId : allProjectsSubscriptions;
    }

    try {
      const id = await firstValueFrom(this.id$);
      const type = await firstValueFrom(this.type$);

      if (id === 'create') {
        sub.isEnabled = await firstValueFrom(this.temporaryIsEnabled$);
        const newSub = await this.subscriptionService.create(type, sub);
        this.router.navigate(['/jobs', 'subscriptions', newSub._id], { queryParams: { type }, replaceUrl: true });
      } else {
        await this.subscriptionService.edit(type, `${id}`, sub);
      }

      this.hasBeenSaved = true;
      this.originalCode = this.code;
      this.subscriptionConfigForm.enable();
      this.hasConfigChanged = false;
      this.hasUnsavedChanges$.next(false);
    } catch {
      const invalidSubscription = $localize`:Invalid subscription|Subscription is not in a valid format:Invalid subscription`;
      this.toastr.error(invalidSubscription);
    } finally {
      this.isSaving = false;
    }
  }

  async ngOnInit() {
    await this.initialize();
  }

  private async initialize(): Promise<void> {
    const id = await firstValueFrom(this.id$);
    const type = await firstValueFrom(this.type$);

    if (id == null) throw new Error('Id missing');

    if (id === 'create') {
      switch (type) {
        case cronSubscriptionKey:
          this.code = cronSubscriptionTemplate;
          break;

        case eventSubscriptionKey:
          this.code = eventSubscriptionTemplate;
          break;
      }
    } else {
      const sub = await firstValueFrom(this.subscriptionService.get(type, id));
      this.subscriptionConfigForm.get('selectedProject')?.setValue(sub.projectId);
      this.code = sub.yaml;
      this.hasConfigChanged = false;
      this.hasUnsavedChanges$.next(false);
      this.subSource = sub.source;
    }

    this.originalCode = this.code;
    this.isInitializing = false;
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  public async delete() {
    const id = await firstValueFrom(this.id$);
    const { type, name } = await firstValueFrom(this.subscription$);

    const result = await this.subscriptionInteractor.deleteBatch([{ _id: id!, type, name }]);
    if (result) {
      this.router.navigate(['/', 'jobs', 'subscriptions']);
    }
  }

  public async updateEnabled(isEnabled: boolean) {
    const id = await firstValueFrom(this.id$);

    if (id === 'create') {
      this.temporaryIsEnabled$.next(isEnabled);
      return;
    }

    const type = await firstValueFrom(this.type$);
    await this.subscriptionInteractor.updateIsEnabled(id!, type, isEnabled);
    this.refreshIsEnabled$.next(true);
  }
}
