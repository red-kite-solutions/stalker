import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { SubscriptionsService } from 'src/app/api/jobs/subscriptions/subscriptions.service';
import { FindingEventSubscription, SubscriptionData } from 'src/app/shared/types/FindingEventSubscription';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { parse, stringify } from 'yaml';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss'],
})
export class SubscriptionComponent {
  public code = '';
  public currentCodeBackup: string | undefined;
  public language = 'yaml';
  public minimapEnabled = false;
  public theme: 'vs-dark' = 'vs-dark';
  public readonly = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<SubscriptionData>();

  public subscriptionTemplate =
    'name: my subscription\nfinding: FindingTypeName\njob:\n  name: JobName\n  parameters:\n  - name: ParamName\n    value: param value\nconditions:\n  - lhs: string\n    operator: contains\n    rhs: ring';

  public selectedRow: FindingEventSubscription | undefined;
  public tempSelectedRow: FindingEventSubscription | undefined;
  public isInNewSubscriptionContext = true;
  public currentSubscriptionId = '';
  public data = new Array<FindingEventSubscription>();

  public dataSource$ = this.refreshData();

  constructor(
    private codeEditorService: CodeEditorService,
    private dialog: MatDialog,
    private subscriptionsService: SubscriptionsService,
    private toastr: ToastrService
  ) {
    this.codeEditorService.load();
    this.code = this.subscriptionTemplate;
    this.currentCodeBackup = this.code;
  }

  private refreshData() {
    return this.subscriptionsService.getSubscriptions().pipe(
      map((data) => {
        this.data = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      })
    );
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

  public NewSubscriptionClick() {
    this.validateCurrentChanges(this.NewSubscriptionNext.bind(this));
  }

  private NewSubscriptionNext() {
    this.isInNewSubscriptionContext = true;
    this.selectedRow = undefined;
    this.code = this.subscriptionTemplate;
    this.currentCodeBackup = this.subscriptionTemplate;
  }

  public SelectFindingSubscription(sub: FindingEventSubscription) {
    this.tempSelectedRow = sub;
    this.validateCurrentChanges(this.SelectFindingSubscriptionNext.bind(this));
  }

  private SelectFindingSubscriptionNext() {
    this.isInNewSubscriptionContext = false;
    this.selectedRow = this.tempSelectedRow;
    const rowData = this.data.find((v) => v._id === this.tempSelectedRow?._id);
    if (rowData?._id) this.currentSubscriptionId = rowData._id;
    const rowCopy = JSON.parse(JSON.stringify(rowData));
    delete rowCopy._id;
    if (rowCopy.job?.parameters?.length === 0) {
      delete rowCopy.job.parameters;
    }
    if (rowCopy.conditions?.length === 0) {
      delete rowCopy.conditions;
    }
    this.code = stringify(<SubscriptionData>rowCopy);
    this.currentCodeBackup = this.code;
  }

  public async SaveSubscriptionEdits() {
    let sub: SubscriptionData;
    try {
      sub = parse(this.code);
    } catch {
      this.toastr.error(
        $localize`:Yaml syntax error|There was a syntax error in the user provided yaml:Yaml syntax error`
      );
      return;
    }

    const invalidSubscription = $localize`:Invalid subscription|Subscription is not in a valid format:Invalid subscription`;
    // validate the content of the sub variable?
    let valid = true;
    if (!sub.finding || !sub.name || !sub.job.name) valid = false;

    if (!valid) {
      this.toastr.error(invalidSubscription);
    }

    try {
      if (this.isInNewSubscriptionContext) {
        // create a new subscription
        const newSub = await this.subscriptionsService.create(sub);
        this.toastr.success(
          $localize`:Successfully created subscription|Successfully created subscription:Successfully created subscription`
        );
      } else {
        // edit an existing subscription
        await this.subscriptionsService.edit(this.currentSubscriptionId, sub);
        this.toastr.success(
          $localize`:Successfully edited subscription|Successfully edited subscription:Successfully edited subscription`
        );
      }
      this.dataSource$ = this.refreshData();
      this.currentCodeBackup = this.code;
    } catch {
      this.toastr.error(invalidSubscription);
    }
  }
}
