import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { SubscriptionsService } from 'src/app/api/jobs/subscriptions/subscriptions.service';
import { FindingEventSubscription, SubscriptionData } from 'src/app/shared/types/finding-event-subscription';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { parse, stringify } from 'yaml';
import { CompaniesService } from '../../../api/companies/companies.service';
import { CompanySummary } from '../../../shared/types/company/company.summary';

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
    'name: my subscription\nfinding: FindingTypeName\njob:\n  name: JobName\n  parameters:\n    - name: ParamName\n      value: param value\nconditions:\n  - lhs: string\n    operator: contains\n    rhs: ring';

  public selectedRow: FindingEventSubscription | undefined;
  public tempSelectedRow: FindingEventSubscription | undefined;
  public isInNewSubscriptionContext = true;
  public currentSubscriptionId = '';
  public data = new Array<FindingEventSubscription>();

  public dataSource$ = this.refreshData();

  selectedCompany: string | undefined = undefined;
  companies: CompanySummary[] = [];
  companies$ = this.companiesService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: CompanySummary[] = [];
      for (const company of next) {
        comp.push({ id: company._id, name: company.name });
      }
      this.companies = comp;
      return this.companies;
    })
  );

  constructor(
    private codeEditorService: CodeEditorService,
    private dialog: MatDialog,
    private subscriptionsService: SubscriptionsService,
    private toastr: ToastrService,
    private companiesService: CompaniesService,
    private titleService: Title
  ) {
    this.codeEditorService.load();
    this.code = this.subscriptionTemplate;
    this.currentCodeBackup = this.code;
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
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

  public newSubscriptionClick() {
    this.validateCurrentChanges(this.newSubscriptionNext.bind(this));
  }

  private newSubscriptionNext() {
    this.isInNewSubscriptionContext = true;
    this.selectedRow = undefined;
    this.selectedCompany = undefined;
    this.code = this.subscriptionTemplate;
    this.currentCodeBackup = this.subscriptionTemplate;
  }

  public selectFindingSubscription(sub: FindingEventSubscription) {
    this.tempSelectedRow = sub;
    this.validateCurrentChanges(this.selectFindingSubscriptionNext.bind(this));
  }

  private selectFindingSubscriptionNext() {
    this.isInNewSubscriptionContext = false;
    this.selectedRow = this.tempSelectedRow;
    this.selectedCompany = this.tempSelectedRow?.companyId;
    const rowData = this.data.find((v) => v._id === this.tempSelectedRow?._id);
    if (rowData?._id) this.currentSubscriptionId = rowData._id;
    const rowCopy = JSON.parse(JSON.stringify(rowData));
    delete rowCopy._id;
    delete rowCopy.companyId;
    if (rowCopy.job?.parameters?.length === 0) {
      delete rowCopy.job.parameters;
    }
    if (rowCopy.conditions?.length === 0) {
      delete rowCopy.conditions;
    }
    this.code = stringify(<SubscriptionData>rowCopy);
    this.currentCodeBackup = this.code;
  }

  public async saveSubscriptionEdits() {
    let sub: SubscriptionData;
    try {
      sub = parse(this.code);
    } catch {
      this.toastr.error(
        $localize`:Yaml syntax error|There was a syntax error in the user provided yaml:Yaml syntax error`
      );
      return;
    }

    if (!this.selectedCompany) {
      this.toastr.error(
        $localize`:Select company before submitting|Select company before submitting:Select company before submitting`
      );
      return;
    }

    sub.companyId = this.selectedCompany;

    const invalidSubscription = $localize`:Invalid subscription|Subscription is not in a valid format:Invalid subscription`;
    // validate the content of the sub variable?
    let valid = true;
    if (!sub.finding || !sub.name || !sub.job.name) valid = false;

    if (!valid) {
      this.toastr.error(invalidSubscription);
    }
    let newSub: undefined | FindingEventSubscription = undefined;
    try {
      if (this.isInNewSubscriptionContext) {
        // create a new subscription
        newSub = await this.subscriptionsService.create(sub);
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

      this.currentCodeBackup = this.code;
      if (newSub) {
        this.dataSource.data.push(newSub);
        this.data.push(newSub);
        this.selectFindingSubscription(newSub);
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
          await this.subscriptionsService.delete(this.currentSubscriptionId);
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
        this.selectedCompany = '';
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
