import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { BehaviorSubject, debounceTime, map, shareReplay, switchMap, tap } from 'rxjs';
import { CustomJobsService } from 'src/app/api/jobs/custom-jobs/custom-jobs.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { CustomJob } from 'src/app/shared/types/jobs/custom-job.type';
import {
  ElementMenuItems,
  FilteredPaginatedTableComponent,
} from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { AuthService } from '../../../api/auth/auth.service';
import { CustomJobTemplatesService } from '../../../api/jobs/custom-job-templates/custom-job-templates.service';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { AuthModule } from '../../auth/auth.module';
import { CustomJobsInteractionService } from './custom-jobs-interaction.service';

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
    MatTooltipModule,
    AuthModule,
    TableFormatComponent,
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
    public customJobsInteractor: CustomJobsInteractionService,
    private titleService: Title,
    public templateService: CustomJobTemplatesService,
    public router: Router,
    public authService: AuthService
  ) {
    this.titleService.setTitle($localize`:Custom jobs list page title|:Custom jobs`);
  }

  public async deleteBatch(jobs: CustomJob[]) {
    const result = await this.customJobsInteractor.delete(jobs);
    if (result) this.refreshData$.next();
  }

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
    await this.customJobsInteractor.syncCache();
  }

  public generateMenuItem = (element: CustomJob): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete custom jobs|Delete custom jobs:Delete`,
    });

    return menuItems;
  };
}
