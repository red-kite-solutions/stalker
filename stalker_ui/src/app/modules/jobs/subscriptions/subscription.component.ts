import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { Observable, map, tap } from 'rxjs';
import { EventSubscriptionsService } from 'src/app/api/jobs/subscriptions/event-subscriptions.service';
import {
  CronSubscription,
  EventSubscription,
  EventSubscriptionData,
  Subscription,
} from 'src/app/shared/types/subscriptions/subscription.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { parse, stringify } from 'yaml';
import { allProjectsSubscriptions } from '../../../api/constants';
import { CronSubscriptionsService } from '../../../api/jobs/subscriptions/cron-subscriptions.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { LocalizedOption } from '../../../shared/types/localized-option.type';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent implements OnDestroy {
  public code = '';
  public currentCodeBackup: string | undefined;
  public language = 'yaml';
  public minimapEnabled = false;
  public theme: CodeEditorTheme = 'vs-dark';
  public readonly = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<Subscription>();

  public subscriptionTemplate =
    'name: my subscription\nfinding: FindingTypeName\ncooldown: 86400\njob:\n  name: JobName\n  parameters:\n    - name: ParamName\n      value: param value\nconditions:\n  - lhs: string\n    operator: contains\n    rhs: ring\n';
  public cronSubscriptionTemplate =
    'name: my cron subscription\ncronExpression: 0 0 12 * * ?\njob:\n  name: JobName\n  parameters:\n  - name: ParamName\n    value: param value\n';

  public selectedRow: Subscription | undefined;
  public tempSelectedRow: Subscription | undefined;
  public isInNewSubscriptionContext = true;
  public subscriptionTypeContext: string | undefined = undefined;
  public currentSubscriptionId = '';
  public data = new Array<Subscription>();

  public dataSource$!: Observable<void> | undefined;
  public readonly eventSubscriptionContext = 'event subscription';
  public readonly cronSubscriptionContext = 'cron susbcription';

  public subscriptionTypes: LocalizedOption[] = [
    {
      value: this.eventSubscriptionContext,
      text: $localize`:Event subscription|Subscription based on an event:Event Subscription`,
    },
    {
      value: this.cronSubscriptionContext,
      text: $localize`:Cron subscription|Subscription based on time:Cron Subscription`,
    },
  ];

  public subscriptionConfigForm = this.fb.group({
    selectedProject: new FormControl<string>(allProjectsSubscriptions),
  });

  public subscriptionTypeForm = this.fb.group({
    subscriptionType: new FormControl<string>(''),
  });

  subscriptionType$ = this.subscriptionTypeForm
    .get('subscriptionType')
    ?.valueChanges.pipe(
      tap((currSubscription) => {
        this.code = '';
        this.currentCodeBackup = '';
        this.subscriptionTypeContext = currSubscription ? currSubscription : undefined;
        if (currSubscription === this.eventSubscriptionContext) {
          this.code = this.subscriptionTemplate;
        } else if (currSubscription === this.cronSubscriptionContext) {
          this.code = this.cronSubscriptionTemplate;
        } else this.code = '';
        this.selectedRow = undefined;
        this.tempSelectedRow = undefined;
        this.currentCodeBackup = this.code;
        this.dataSource$ = this.refreshData();
      })
    )
    .subscribe();

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
    private eventSubscriptionsService: EventSubscriptionsService,
    private cronSubscriptionsService: CronSubscriptionsService,
    private toastr: ToastrService,
    private projectsService: ProjectsService,
    private titleService: Title,
    private fb: FormBuilder
  ) {
    this.code = '';
    this.currentCodeBackup = this.code;
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
    this.subscriptionTypeForm.get('subscriptionType')?.setValue(this.subscriptionTypes[0].value);
  }

  private refreshData() {
    if (this.subscriptionTypeContext === undefined) return;
    if (this.subscriptionTypeContext === this.eventSubscriptionContext) {
      return this.eventSubscriptionsService.getSubscriptions().pipe(
        map((data) => {
          this.data = data;
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          if (this.selectedRow) this.selectSubscription(this.selectedRow);
        })
      );
    } else {
      return this.cronSubscriptionsService.getSubscriptions().pipe(
        map((data) => {
          this.data = data;
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          if (this.selectedRow) this.selectSubscription(this.selectedRow);
        })
      );
    }
  }

  private validateCurrentChanges(next: Function) {
    if (this.code === this.currentCodeBackup) {
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

  public newSubscriptionClick() {
    this.validateCurrentChanges(this.newSubscriptionNext.bind(this));
  }

  private newSubscriptionNext() {
    this.isInNewSubscriptionContext = true;
    this.selectedRow = undefined;
    this.subscriptionConfigForm.get('selectedProject')?.setValue(allProjectsSubscriptions);
    this.code = '';
    this.currentCodeBackup = '';
  }

  public selectSubscription(sub: Subscription) {
    this.tempSelectedRow = sub;
    this.validateCurrentChanges(this.selectFindingSubscriptionNext.bind(this));
  }

  private selectFindingSubscriptionNext() {
    this.isInNewSubscriptionContext = false;
    this.selectedRow = this.tempSelectedRow;
    this.tempSelectedRow?.projectId
      ? this.subscriptionConfigForm.get('selectedProject')?.setValue(this.tempSelectedRow?.projectId)
      : this.subscriptionConfigForm.get('selectedProject')?.setValue(allProjectsSubscriptions);
    const rowData = this.data.find((v) => v._id === this.tempSelectedRow?._id);
    if (rowData?._id) this.currentSubscriptionId = rowData._id;
    const rowCopy = JSON.parse(JSON.stringify(rowData));
    delete rowCopy._id;
    delete rowCopy.projectId;
    if (rowCopy.job?.parameters?.length === 0) {
      delete rowCopy.job.parameters;
    }
    if (rowCopy.conditions?.length === 0) {
      delete rowCopy.conditions;
    }
    this.code = stringify(<EventSubscriptionData>rowCopy);
    this.currentCodeBackup = this.code;
  }

  public async saveSubscriptionEdits() {
    let sub: Subscription;
    try {
      sub = parse(this.code);
    } catch {
      this.toastr.error(
        $localize`:Yaml syntax error|There was a syntax error in the user provided yaml:Yaml syntax error`
      );
      return;
    }

    if (this.subscriptionConfigForm.get('selectedProject')?.value) {
      const cId = this.subscriptionConfigForm.get('selectedProject')?.value;
      sub.projectId = cId ? cId : allProjectsSubscriptions;
    }

    const invalidSubscription = $localize`:Invalid subscription|Subscription is not in a valid format:Invalid subscription`;
    // validate the content of the sub variable?
    let valid = true;
    if (!sub.name || !sub.job || !sub.job.name) valid = false;

    if (!valid) {
      this.toastr.error(invalidSubscription);
    }
    let newSub: undefined | Subscription = undefined;
    try {
      if (this.isInNewSubscriptionContext) {
        // create a new subscription

        if (this.subscriptionTypeContext === this.eventSubscriptionContext) {
          sub = sub as EventSubscription;
          newSub = await this.eventSubscriptionsService.create(sub);
        } else {
          sub = sub as CronSubscription;
          newSub = await this.cronSubscriptionsService.create(sub);
        }

        this.toastr.success(
          $localize`:Successfully created subscription|Successfully created subscription:Successfully created subscription`
        );
      } else {
        // edit an existing subscription
        if (this.subscriptionTypeContext === this.eventSubscriptionContext) {
          sub = sub as EventSubscription;
          await this.eventSubscriptionsService.edit(this.currentSubscriptionId, sub);
        } else {
          sub = sub as CronSubscription;
          await this.cronSubscriptionsService.edit(this.currentSubscriptionId, sub);
        }
        this.toastr.success(
          $localize`:Successfully edited subscription|Successfully edited subscription:Successfully edited subscription`
        );
      }

      this.currentCodeBackup = this.code;
      if (newSub) {
        this.dataSource.data.push(newSub);
        this.data.push(newSub);
        this.selectSubscription(newSub);
      }

      this.dataSource$ = this.refreshData();
    } catch {
      this.toastr.error(invalidSubscription);
    }
  }

  public async delete() {
    if (this.isInNewSubscriptionContext) {
      this.toastr.warning(
        $localize`:Select a subscription to delete|The user needs to select a subscription to delete:Select a subscription to delete`
      );
      return;
    }

    const data: ConfirmDialogData = {
      text: $localize`:Confirm subscription deletion|Confirmation message asking if the user really wants to delete this description:Do you really wish to delete this description permanently ?`,
      title: $localize`:Deleting subscription|Title of a page to delete a subscription:Deleting subscription`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        try {
          if (this.subscriptionTypeContext === this.eventSubscriptionContext)
            await this.eventSubscriptionsService.delete(this.currentSubscriptionId);
          else await this.cronSubscriptionsService.delete(this.currentSubscriptionId);

          this.toastr.success(
            $localize`:Successfully deleted subscription|Successfully deleted subscription:Successfully deleted subscription`
          );
          this.dataSource$ = this.refreshData();
        } catch {
          this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
        }
        this.dialog.closeAll();
        this.code = '';
        this.currentCodeBackup = '';
        this.currentSubscriptionId = '';
        this.isInNewSubscriptionContext = true;
        this.selectedRow = undefined;
        this.tempSelectedRow = undefined;
        this.subscriptionConfigForm.get('selectedProject')?.setValue(allProjectsSubscriptions);
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  ngOnDestroy(): void {
    this.subscriptionType$?.unsubscribe();
  }

  async revertToDefault(): Promise<void> {
    if (!this.selectedRow?._id) return;

    try {
      if (this.subscriptionTypeContext === this.subscriptionTypes[0].value) {
        await this.eventSubscriptionsService.revert(this.selectedRow._id);
      } else if (this.subscriptionTypeContext === this.subscriptionTypes[1].value) {
        await this.cronSubscriptionsService.revert(this.selectedRow._id);
      } else {
        this.toastr.warning($localize`:Nothing to revert|Nothing to revert:Nothing to revert`);
        return;
      }
      this.toastr.success(
        $localize`:Successfully reverted subscription|Successfully reverted subscription:Successfully reverted subscription`
      );
      this.dataSource$ = this.refreshData();
    } catch {
      this.toastr.error($localize`:Error while reverting|Error while reverting:Error while reverting`);
    }
  }
}
