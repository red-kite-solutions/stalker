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
  ],
})
export class ListCustomJobsComponent {
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
    private dialog: MatDialog
  ) {
    this.titleService.setTitle($localize`:Custom jobs list page title|:Custom jobs`);
  }

  public async delete() {
    const data: ConfirmDialogData = {
      text: $localize`:Confirm custom job deletion|Confirmation message asking if the user really wants to delete this description:Do you really wish to delete this description permanently ?`,
      title: $localize`:Deleting custom job|Title of a page to delete a custom job:Deleting custom job`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
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
}
