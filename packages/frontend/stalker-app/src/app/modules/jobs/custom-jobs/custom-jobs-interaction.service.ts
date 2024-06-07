import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { CustomJobsService } from 'src/app/api/jobs/custom-jobs/custom-jobs.service';
import { CustomJob } from 'src/app/shared/types/jobs/custom-job.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class CustomJobsInteractionService {
  constructor(
    private customJobsService: CustomJobsService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public async delete(jobs: Pick<CustomJob, '_id' | 'name'>[]): Promise<boolean> {
    let data: ConfirmDialogData = {
      text: $localize`:Select jobs again|No job was selected so there is nothing to delete:Select the jobs to delete and try again.`,
      title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
      primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
    };

    if (jobs.length > 0) {
      data = {
        text: $localize`:Confirm custom job deletion|Confirmation message asking if the user really wants to delete this job:Do you really wish to delete these jobs permanently ?`,
        title: $localize`:Deleting custom jobs|Title of a page to delete a custom job:Deleting custom jobs`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: jobs.map((x) => x.name),
        onPrimaryButtonClick: (close) => close(false),
        onDangerButtonClick: async (close) => {
          for (const job of jobs) {
            try {
              await this.customJobsService.delete(job._id);
            } catch {
              this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
              continue;
            }
          }

          this.toastr.success(
            $localize`:Successfully deleted custom job|Successfully deleted custom job:Successfully deleted custom job`
          );

          close(true);
        },
      };
    }

    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          restoreFocus: false,
        })
        .afterClosed()
    );
  }

  public async syncCache() {
    const data: ConfirmDialogData = {
      text: $localize`:Confirm orchestrator cache sync|Confirmation message asking if the user really wants to sync the orchestrator cache:Do you really wish to sync the Orchestrator's cache? It will send the jobs' latest version to the Orchestrator.`,
      title: $localize`:Syncing the orchestrator cache|Title of a page to sync the orchestrator's cache:Syncing the Orchestrator cache`,
      primaryButtonText: $localize`:Sync|Sync:Sync`,
      dangerButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.customJobsService.syncCache();
        } catch {
          this.toastr.error($localize`:Error while syncing|Error while syncing:Error while syncing`);
          return;
        }
        this.toastr.success($localize`:Cache synced|Cache synced:Cache synced`);
        close(true);
      },
      onDangerButtonClick: (close) => {
        close(false);
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
