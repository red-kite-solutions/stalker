import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, debounceTime, map, shareReplay, switchMap, tap } from 'rxjs';
import { CustomJobsService } from 'src/app/api/jobs/custom-jobs/custom-jobs.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { CustomJob } from 'src/app/shared/types/jobs/custom-job.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { FilteredPaginatedTableComponent } from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { AuthService } from '../../../api/auth/auth.service';
import { AuthModule } from '../../auth/auth.module';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'app-list-custom-jobs',
  templateUrl: 'list-custom-jobs.component.html',
  styleUrls: ['./list-custom-jobs.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    AvatarComponent,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatMenuModule,
    FilteredPaginatedTableComponent,
    MatDialogModule,
    MatTooltipModule,
    AuthModule,
  ],
})
export class ListCustomJobsComponent {
  public noDataMessage = $localize`:No job found|No job was found:No job found`;
  public isLoading$ = new BehaviorSubject(true);
  public selection = new SelectionModel<CustomJob>(true, []);

  private filters$ = new BehaviorSubject<string[]>([]);
  private refreshData$ = new BehaviorSubject<void>(undefined);
  public customJobs$ = this.refreshData$.pipe(
    switchMap(() =>
      this.customJobsService.getCustomJobs().pipe(
        map((customJobs) => customJobs.sort((a, b) => a._id.localeCompare(b._id))),
        switchMap((customJobs) =>
          this.filters$.pipe(
            debounceTime(250),
            map((filters) => filters.map((filter) => this.normalizeString(filter))),
            map((filters) =>
              customJobs.filter((customJob) => !filters.length || this.filterCustomJob(customJob, filters))
            )
          )
        ),
        shareReplay(1)
      )
    )
  );

  public dataSource$ = this.customJobs$.pipe(
    map((customJob) => new MatTableDataSource<CustomJob>(customJob)),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private customJobsService: CustomJobsService,
    private toastr: ToastrService,
    private titleService: Title,
    private dialog: MatDialog,
    public authService: AuthService
  ) {
    this.titleService.setTitle($localize`:Custom jobs list page title|:Custom jobs`);
  }

  public async delete() {
    let data: ConfirmDialogData = {
      text: $localize`:Select jobs again|No job was selected so there is nothing to delete:Select the jobs to delete and try again.`,
      title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
      primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
    };

    const bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((cj: CustomJob) => {
      const bp = cj.name;
      bulletPoints.push(bp);
    });

    if (this.selection.selected.length > 0) {
      data = {
        text: $localize`:Confirm custom job deletion|Confirmation message asking if the user really wants to delete this job:Do you really wish to delete these jobs permanently ?`,
        title: $localize`:Deleting custom jobs|Title of a page to delete a custom job:Deleting custom jobs`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: bulletPoints,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async () => {
          for (const customJob of this.selection.selected) {
            try {
              await this.customJobsService.delete(customJob._id);
            } catch {
              this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
              return;
            }
          }

          this.toastr.success(
            $localize`:Successfully deleted custom job|Successfully deleted custom job:Successfully deleted custom job`
          );

          this.refreshData$.next();
          this.dialog.closeAll();
        },
      };
    }

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  public revertToDefault() {}
  public pageChange(e: any) {}
  public filterChange(filters: string[]) {
    this.filters$.next(filters);
  }

  private filterCustomJob(customJob: CustomJob, filters: string[]) {
    const parts = [customJob.name, customJob.findingHandlerLanguage, customJob.type];
    return filters.some((filter) => this.normalizeString(parts.join(' ')).includes(filter));
  }

  private normalizeString(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  public async syncCache() {
    let data = {
      text: $localize`:Confirm orchestrator cache sync|Confirmation message asking if the user really wants to sync the orchestrator cache:Do you really wish to sync the Orchestrator's cache? It will send the jobs' latest version to the Orchestrator.`,
      title: $localize`:Syncing the orchestrator cache|Title of a page to sync the orchestrator's cache:Syncing the Orchestrator cache`,
      primaryButtonText: $localize`:Sync|Sync:Sync`,
      dangerButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      onPrimaryButtonClick: async () => {
        try {
          await this.customJobsService.syncCache();
        } catch {
          this.toastr.error($localize`:Error while syncing|Error while syncing:Error while syncing`);
          return;
        }
        this.toastr.success($localize`:Cache synced|Cache synced:Cache synced`);
        this.dialog.closeAll();
      },
      onDangerButtonClick: () => {
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
