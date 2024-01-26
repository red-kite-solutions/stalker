import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
import { firstValueFrom, map, timer } from 'rxjs';
import { eventSubscriptionKey } from 'src/app/api/jobs/subscriptions/event-subscriptions.service';
import { SubscriptionService, SubscriptionType } from 'src/app/api/jobs/subscriptions/subscriptions.service';
import { AppHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Subscription } from 'src/app/shared/types/subscriptions/subscription.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { SpinnerButtonComponent } from 'src/app/shared/widget/spinner-button/spinner-button.component';
import { parse } from 'yaml';
import { allProjectsSubscriptions } from '../../../api/constants';
import { cronSubscriptionKey } from '../../../api/jobs/subscriptions/cron-subscriptions.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { CodeEditorComponent, CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';
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
    MatSidenavModule,
    MatTabsModule,
    MatTooltipModule,
    MatCardModule,
    SpinnerButtonComponent,
  ],
})
export class SubscriptionComponent implements OnInit {
  public code = '';
  public originalCode = '';
  public theme: CodeEditorTheme = 'vs-dark';
  public isSaving = false;

  public subscription$ = timer(0, 250).pipe(map(() => parse(this.code)));
  private id$ = this.activatedRoute.paramMap.pipe(map((x) => x.get('id')));
  private type$ = this.activatedRoute.queryParamMap.pipe(map((x) => x.get('type') as SubscriptionType));

  public selectedRow: Subscription | undefined;
  public tempSelectedRow: Subscription | undefined;
  public subscriptionTypeContext: string | undefined = undefined;
  public currentSubscriptionId = '';
  public data = new Array<Subscription>();

  public hasBeenSaved = false;
  public get canSave() {
    return this.code != this.originalCode;
  }

  public subscriptionConfigForm = this.fb.group({
    selectedProject: new FormControl<string>(allProjectsSubscriptions),
  });

  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: ProjectSummary[] = [];
      for (const project of next) {
        comp.push({ id: project._id, name: project.name });
      }
      this.projects = comp;
      return this.projects;
    })
  );

  constructor(
    private dialog: MatDialog,
    private toastr: ToastrService,
    private projectsService: ProjectsService,
    private titleService: Title,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService
  ) {
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
  }

  private validateCurrentChanges(next: Function) {
    if (this.code === this.originalCode) {
      next();
      return;
    }

    const data: ConfirmDialogData = {
      text: $localize`:Unsaved subscription changes|Unsaved subscription changes:There are unsaved changes to the current finding event subscription.`,
      title: $localize`:Unsaved Changes Detected|There are unsaved changes that the user may want to save:Unsaved Changes Detected`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Discard|Confirm that the user wants to leave despite losing changes:Discard`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: () => {
        next();
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  public async save() {
    this.isSaving = true;

    let sub: Subscription;
    try {
      sub = parse(this.code);
    } catch {
      this.toastr.error(
        $localize`:Yaml syntax error|There was a syntax error in the user provided yaml:Yaml syntax error`
      );
      this.isSaving = false;
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
        const newSub = await this.subscriptionService.create(type, sub);
        this.router.navigate(['/jobs', 'subscriptions', newSub._id], { queryParams: { type } });
      } else {
        await this.subscriptionService.edit(type, `${id}`, sub);
      }

      this.originalCode = this.code;
    } catch {
      const invalidSubscription = $localize`:Invalid subscription|Subscription is not in a valid format:Invalid subscription`;
      this.toastr.error(invalidSubscription);
    }

    this.isSaving = false;
    this.hasBeenSaved = true;
  }

  async ngOnInit(): Promise<void> {
    const id = await firstValueFrom(this.id$);
    const type = await firstValueFrom(this.type$);

    // TODO 162: cleanup
    if (id == null) throw new Error('oopsies');

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
      this.code = sub.yaml;
    }

    this.originalCode = this.code;
  }
}
