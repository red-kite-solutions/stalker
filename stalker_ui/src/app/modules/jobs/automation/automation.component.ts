import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { from, map } from 'rxjs';
import { FindingEventSubscription } from 'src/app/shared/types/FindingEventSubscription';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { stringify } from 'yaml';

@Component({
  selector: 'app-automation',
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss'],
})
export class AutomationComponent {
  public code = '';
  public currentCodeBackup: string | undefined;
  public language = 'yaml';
  public minimapEnabled = false;
  public theme: 'vs-dark' = 'vs-dark';
  public readonly = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<FindingEventSubscription>();

  public subscriptionTemplate =
    'name: my subscription\nfinding: FindingTypeName\njob:\n  name: JobName\n  parameters:\n  - name: ParamName\n    value: param value\nconditions:\n  - lhs: string\n    operator: contains\n    rhs: ring';

  public selectedRow: FindingEventSubscription | undefined;
  public tempSelectedRow: FindingEventSubscription | undefined;

  private genData = [1];
  public data = new Array<FindingEventSubscription>(
    {
      name: 'This is the subscription of a lifetime',
      finding: 'HostNameIpFinding',
      job: {
        name: 'TcpPortScanningJob',
        parameters: [
          {
            name: 'targetIp',
            value: '127.0.0.1',
          },
          {
            name: 'threads',
            value: 10,
          },
          {
            name: 'socketTimeoutSeconds',
            value: 1,
          },
          {
            name: 'portMin',
            value: 1,
          },
          {
            name: 'portMax',
            value: 1000,
          },
          {
            name: 'ports',
            value: '[1234, 3389, 8080]',
          },
        ],
      },
      conditions: [
        {
          lhs: '${ip}',
          operator: 'contains',
          rhs: '127',
        },
      ],
    },
    {
      name: 'My subscription',
      finding: 'HostnameIpFinding',
      job: {
        name: 'TcpPortScanningJob',
      },
    }
  );

  public dataSource$ = from(this.genData).pipe(
    map((data) => {
      this.dataSource.data = this.data;
      this.dataSource.paginator = this.paginator;
    })
  );

  constructor(private codeEditorService: CodeEditorService, private dialog: MatDialog) {
    this.codeEditorService.load();
    this.code = this.subscriptionTemplate;
    this.currentCodeBackup = this.code;
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
    this.selectedRow = undefined;
    this.code = this.subscriptionTemplate;
    this.currentCodeBackup = this.subscriptionTemplate;
  }

  public SelectFindingSubscription(sub: FindingEventSubscription) {
    this.tempSelectedRow = sub;
    this.validateCurrentChanges(this.SelectFindingSubscriptionNext.bind(this));
  }

  private SelectFindingSubscriptionNext() {
    this.selectedRow = this.tempSelectedRow;
    const newYaml = this.data.find((v) => v.name === this.tempSelectedRow?.name);
    this.code = stringify(newYaml);
    this.currentCodeBackup = this.code;
  }

  public SaveSubscriptionEdits() {
    this.currentCodeBackup = this.code;
  }
}
