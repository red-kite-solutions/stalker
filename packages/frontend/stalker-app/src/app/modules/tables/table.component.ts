import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { DateRange } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, switchMap, tap } from 'rxjs';
import { FindingsService } from '../../api/findings/findings.service';
import { ProjectsService } from '../../api/projects/projects.service';
import { TablesService } from '../../api/tables/tables.service';
import { TagsService } from '../../api/tags/tags.service';
import { ResourcesServiceFactory } from '../../services/resources/resources-service.factory';
import { PanelSectionModule } from '../../shared/components/panel-section/panel-section.module';
import { PlaceholderComponent } from '../../shared/components/placeholder/placeholder.component';
import { ProjectCellComponent } from '../../shared/components/project-cell/project-cell.component';
import { SharedModule } from '../../shared/shared.module';
import { IdentifiedElement } from '../../shared/types/identified-element.type';
import { Table } from '../../shared/types/tables/table.type';
import { FilteredPaginatedTableComponent } from '../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import {
  TABLE_FILTERS_SOURCE_INITAL_FILTERS,
  TableFilters,
  TableFiltersSource,
  TableFiltersSourceBase,
} from '../../shared/widget/filtered-paginated-table/table-filters-source';
import { TableFormatComponent } from '../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { BlockedPillTagComponent } from '../../shared/widget/pill-tag/blocked-pill-tag.component';
import { PillTagComponent } from '../../shared/widget/pill-tag/pill-tag.component';
import { globalProjectFilter$ } from '../../utils/global-project-filter';
import { resourcesTableConfig } from './resources-config';

@Component({
  standalone: true,
  selector: 'rk-table',
  templateUrl: 'table.component.html',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    FilteredPaginatedTableComponent,
    TableFormatComponent,
    BlockedPillTagComponent,
    PillTagComponent,
    ProjectCellComponent,
    SharedModule,
    PanelSectionModule,
    PlaceholderComponent,
  ],
  providers: [
    { provide: TableFiltersSourceBase, useClass: TableFiltersSource },
    {
      provide: TABLE_FILTERS_SOURCE_INITAL_FILTERS,
      useValue: {
        filters: ['-is: blocked'],
        pagination: { page: 0, pageSize: 25 },
      } as TableFilters,
    },
  ],
})
export class TableComponent {
  public readonly noDataMessage = $localize`:No resources found|No resources were found:No resources found`;

  public projects$ = this.projectsService.getAllSummaries().pipe(shareReplay(1));
  public tags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  private refresh$ = new BehaviorSubject(null);
  public isLoading$ = new BehaviorSubject(true);

  public tableId$ = this.route.params.pipe(map((params) => params['id'] as string));
  public table$ = this.tableId$.pipe(
    tap(() => this.isLoading$.next(true)),
    switchMap((tableId) => this.tablesService.getTable(tableId)),
    tap((table) => {
      this.titleService.setTitle($localize`:Table page title|:Table · ${table.name}`);
      this.isLoading$.next(false);
    }),
    shareReplay(1)
  );

  private _dataSource$ = combineLatest([
    this.table$,
    this.filtersSource.debouncedFilters$,
    globalProjectFilter$,
    this.refresh$,
  ]).pipe(
    switchMap(([table, { dateRange, pagination }, globalProjectFilter]) => {
      const service = this.resourcesServiceFactory.create(table.resource);
      return service.getPage(
        pagination?.page || 0,
        pagination?.pageSize || 25,
        globalProjectFilter != null ? { projects: [globalProjectFilter.id] } : undefined,
        dateRange ?? new DateRange<Date>(null, null)
      );
    })
  );

  public displayColumns$ = this.table$.pipe(
    map((table) => [...resourcesTableConfig[table.resource].baseColumns, ...table.fields.map((f) => f.id)])
  );
  public customColumns$ = this.table$.pipe(map((table) => table.fields));

  public dataSource$ = this._dataSource$.pipe(map((data) => new MatTableDataSource<IdentifiedElement>(data.items)));
  public count$ = this._dataSource$.pipe(map((data) => data.totalRecords));
  public findings$ = combineLatest([this.table$, this._dataSource$]).pipe(
    switchMap(([table, data]) => this.getFindings(table, data.items))
  );

  constructor(
    private route: ActivatedRoute,
    private tablesService: TablesService,
    private projectsService: ProjectsService,
    private tagsService: TagsService,
    private titleService: Title,
    private resourcesServiceFactory: ResourcesServiceFactory,
    private findingsService: FindingsService,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {}

  private getFindings(table: Table, elements: IdentifiedElement[]): Observable<unknown> {
    return this.findingsService.getPage(0, 1000).pipe(map(({ items }) => {}));
  }
}
