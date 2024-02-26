import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
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
import { BehaviorSubject, Observable, firstValueFrom, map, timer } from 'rxjs';
import { eventSubscriptionKey } from 'src/app/api/jobs/subscriptions/event-subscriptions.service';
import { SubscriptionService, SubscriptionType } from 'src/app/api/jobs/subscriptions/subscriptions.service';
import { ThemeService } from 'src/app/services/theme.service';
import { AppHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { PanelSectionModule } from 'src/app/shared/components/panel-section/panel-section.module';
import { HasUnsavedChanges } from 'src/app/shared/guards/unsaved-changes-can-deactivate.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Subscription } from 'src/app/shared/types/subscriptions/subscription.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { SavingButtonComponent } from 'src/app/shared/widget/spinner-button/saving-button.component';
import { SpinnerButtonComponent } from 'src/app/shared/widget/spinner-button/spinner-button.component';
import { TextMenuComponent } from 'src/app/shared/widget/text-menu/text-menu.component';
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
    TextMenuComponent,
    PanelSectionModule,
    MatDividerModule,
    SavingButtonComponent,
  ],
})
export class SubscriptionComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  public code = '';
  public originalCode = '';
  public isSaving = false;
  public isInitializing = true;
  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );

  public subscription$ = timer(0, 250).pipe(map(() => parse(this.code)));
  private id$ = this.activatedRoute.paramMap.pipe(map((x) => x.get('id')));
  private type$ = this.activatedRoute.queryParamMap.pipe(map((x) => x.get('type') as SubscriptionType));

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
    private dialog: MatDialog,
    private toastr: ToastrService,
    private projectsService: ProjectsService,
    private titleService: Title,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private themeService: ThemeService
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

  public async forceSave() {
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
        const newSub = await this.subscriptionService.create(type, sub);
        this.router.navigate(['/jobs', 'subscriptions', newSub._id], { queryParams: { type } });
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
    }

    this.originalCode = this.code;
    this.isInitializing = false;
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  public async deleteSubscription() {
    const data: ConfirmDialogData = {
      text: $localize`:Confirm subscription deletion|Confirmation message asking if the user really wants to delete the subscription:Do you really wish to delete this subscription permanently ?`,
      title: $localize`:Deleting subscription|Title of a page to delete a subscription:Deleting subscription`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        try {
          const id = await firstValueFrom(this.id$);
          const type = await firstValueFrom(this.type$);
          if (id == null) throw new Error('Id is null.');

          await this.subscriptionService.delete(type, id);

          this.router.navigate(['/', 'jobs', 'subscriptions']);
          this.toastr.success(
            $localize`:Subscription deleted|The subscription has been deleted:Subscription successfully deleted`
          );
          this.router.navigate(['/hosts/']);
          this.dialog.closeAll();
        } catch (err) {
          const errorDeleting = $localize`:Error while deleting|Error while deleting an item:Error while deleting`;
          this.toastr.error(errorDeleting);
        }
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
  public async revertToOriginal() {
    const data: ConfirmDialogData = {
      text: $localize`:Confirm revert to original|Confirmation message asking if the user really wants to revert the subscription to the original configuraton:Do you really wish to revert this subscription to its original configuration?`,
      title: $localize`:Reverting subscription to original|Title of a page to revert a subscription to the original configuration:Revert to original`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Revert to original|Confirm that the user wants to revert the subscription to its original configuration:Revert to original`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        try {
          const id = await firstValueFrom(this.id$);
          const type = await firstValueFrom(this.type$);
          if (id == null) throw new Error('Id is null.');

          await this.subscriptionService.revert(type, id);

          this.toastr.success(
            $localize`:Subscription reverted|The subscription has been reverted to its original configuration:Subscription successfully reverted to its original configuration`
          );

          this.dialog.closeAll();

          await this.initialize();
        } catch (err) {
          const errorReverting = $localize`:Error while deleting|Error while deleting an item:Error while deleting`;
          this.toastr.error(errorReverting);
        }
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
