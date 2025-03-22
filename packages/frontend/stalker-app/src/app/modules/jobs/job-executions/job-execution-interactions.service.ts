import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { JobExecutionsService } from '../../../api/jobs/job-executions/job-executions.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/widget/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class JobExecutionInteractionsService {
  constructor(
    private jobExecutionService: JobExecutionsService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public async stopJob(jobId: string) {
    let data: ConfirmDialogData;

    data = {
      text: $localize`:Stopping execution|Warning before stopping job execution:Do you really want to stop the current job execution?`,
      title: $localize`:Stopping execution title|Stopping the current job execution:Stopping execution`,
      dangerButtonText: $localize`:Stop job|Stop the current running job:Stop job`,
      enableCancelButton: true,
      onDangerButtonClick: async (close) => {
        await this.jobExecutionService.stopJob(jobId);
        this.toastr.success(
          $localize`:Sent termination signal|Confirms that the termination signal is sent:Sent termination signal`
        );
        close(true);
      },
    };

    return await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          restoreFocus: false,
        })
        .afterClosed()
    );
  }
}
