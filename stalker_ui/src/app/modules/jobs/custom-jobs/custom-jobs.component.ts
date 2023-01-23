import { Component, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
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
import { CustomJobsService } from '../../../api/jobs/custom-jobs/custom-jobs.service';
import { CustomJob, CustomJobData } from '../../../shared/types/custom-job';

@Component({
  selector: 'app-custom-jobs',
  templateUrl: './custom-jobs.component.html',
  styleUrls: ['./custom-jobs.component.scss'],
})
export class CustomJobsComponent {
  public customJobNameFormControl = new FormControl('', [Validators.required]);
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

  constructor(
    private codeEditorService: CodeEditorService,
    private dialog: MatDialog,
    private customJobsService: CustomJobsService,
    private toastr: ToastrService,
    private titleService: Title
  ) {
    this.codeEditorService.load();
    this.code = '';
    this.currentCodeBackup = this.code;
    this.titleService.setTitle($localize`:Custom Jobs|:Custom Jobs`);
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
    this.customJobNameFormControl.setValue('');
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

    this.customJobNameFormControl.setValue(rowData?.name ? rowData.name : '');
    this.code = rowData?.code ? rowData.code : '';
    this.currentCodeBackup = this.code;
  }

  public async saveCustomJobEdits() {
    if (!this.customJobNameFormControl.valid || !this.customJobNameFormControl.value) {
      this.customJobNameFormControl.markAsTouched();
      this.toastr.error($localize`:Empty Name|A job name is required:Name job before submitting`);
      return;
    }
    const name = this.customJobNameFormControl.value;

    if (!this.code) {
      this.toastr.error(
        $localize`:Empty Code|Write some code before submitting custom job:Write code before submitting`
      );
      return;
    }
    const code = this.code;

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
        this.customJobNameFormControl.setValue('');
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
