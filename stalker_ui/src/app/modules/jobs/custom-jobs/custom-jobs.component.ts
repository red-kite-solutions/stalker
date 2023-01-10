import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { CompaniesService } from '../../../api/companies/companies.service';
import { CustomJobsService } from '../../../api/jobs/custom-jobs/custom-jobs.service';
import { CompanySummary } from '../../../shared/types/company/company.summary';
import { CustomJob, CustomJobData } from '../../../shared/types/custom-job';

@Component({
  selector: 'app-custom-jobs',
  templateUrl: './custom-jobs.component.html',
  styleUrls: ['./custom-jobs.component.scss'],
})
export class CustomJobsComponent {
  public customJobName = 'Temp Name For Testing';
  public code = '';
  public currentCodeBackup: string | undefined;
  public language = 'python';
  public minimapEnabled = false;
  public theme: 'vs-dark' = 'vs-dark';
  public readonly = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<CustomJobData>();

  public selectedRow: CustomJob | undefined;
  public tempSelectedRow: CustomJob | undefined;
  public isInNewCustomJobContext = true;
  public currentCustomJobId = '';
  public data = new Array<CustomJob>();

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
    private customJobsService: CustomJobsService,
    private toastr: ToastrService,
    private companiesService: CompaniesService,
    private titleService: Title
  ) {
    this.codeEditorService.load();
    this.code = '';
    this.currentCodeBackup = this.code;
    this.titleService.setTitle($localize`:Subscriptions list page title|:Subscriptions`);
  }

  private refreshData() {
    return this.customJobsService.getCustomJobs().pipe(
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
      text: $localize`:Unsaved job changes|Unsaved job changes:There are unsaved changes to the current custom job.`,
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

  public newCustomJobClick() {
    this.validateCurrentChanges(this.newCustomJobNext.bind(this));
  }

  private newCustomJobNext() {
    this.isInNewCustomJobContext = true;
    this.selectedRow = undefined;
    this.selectedCompany = undefined;
    this.code = '';
    this.currentCodeBackup = this.code;
  }

  public selectCustomJob(sub: CustomJob) {
    this.tempSelectedRow = sub;
    this.validateCurrentChanges(this.selectCustomJobNext.bind(this));
  }

  private selectCustomJobNext() {
    this.isInNewCustomJobContext = false;
    this.selectedRow = this.tempSelectedRow;
    const rowData = this.data.find((v) => v._id === this.tempSelectedRow?._id);
    if (rowData?._id) this.currentCustomJobId = rowData._id;
    const rowCopy = JSON.parse(JSON.stringify(rowData));
    delete rowCopy._id;
    if (rowCopy.job?.parameters?.length === 0) {
      delete rowCopy.job.parameters;
    }
    if (rowCopy.conditions?.length === 0) {
      delete rowCopy.conditions;
    }
    this.code = rowCopy.code;
    this.currentCodeBackup = this.code;
  }

  public async saveCustomJobEdits() {
    if (!this.customJobName) {
      this.toastr.error($localize`:Empty Name|A job name is required:Name job before submitting`);
      return;
    }
    const name = this.customJobName;

    if (!this.code) {
      this.toastr.error(
        $localize`:Empty Code|Write some code before submitting custom job:Write code before submitting`
      );
      return;
    }
    const code = this.code;

    if (!this.selectedCompany) {
      this.toastr.error(
        $localize`:Select company before submitting|Select company before submitting:Select company before submitting`
      );
      return;
    }

    const job: CustomJobData = {
      language: this.language, // always python for now
      type: 'code',
      name: name,
      code: code,
    };

    const invalidCustomJob = $localize`:Invalid custom job|Custom job is not in a valid format:Invalid custom job`;

    let newCustomJob: undefined | CustomJob = undefined;
    try {
      if (this.isInNewCustomJobContext) {
        // create a new subscription
        newCustomJob = await this.customJobsService.create(job);
        this.toastr.success(
          $localize`:Successfully created subscription|Successfully created subscription:Successfully created subscription`
        );
      } else {
        // edit an existing subscription
        await this.customJobsService.edit(this.currentCustomJobId, job);
        this.toastr.success(
          $localize`:Successfully edited subscription|Successfully edited subscription:Successfully edited subscription`
        );
      }

      this.currentCodeBackup = this.code;
      if (newCustomJob) {
        this.dataSource.data.push(newCustomJob);
        this.data.push(newCustomJob);
        this.selectCustomJob(newCustomJob);
      }

      this.dataSource$ = this.refreshData();
    } catch {
      this.toastr.error(invalidCustomJob);
    }
  }

  public async delete() {
    if (this.isInNewCustomJobContext) {
      this.toastr.warning(
        $localize`:Select a custom job to delete|The user needs to select a custom job to delete:Select a job to delete`
      );
      return;
    }

    const data: ConfirmDialogData = {
      text: $localize`:Confirm custom job deletion|Confirmation message asking if the user really wants to delete this custom job:Do you really wish to delete this custom job permanently ?`,
      title: $localize`:Deleting Custom Job|Title of a page to delete a custom job:Deleting custom job`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        try {
          await this.customJobsService.delete(this.currentCustomJobId);
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
        this.currentCustomJobId = '';
        this.isInNewCustomJobContext = true;
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
