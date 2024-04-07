import { SelectionModel } from '@angular/cdk/collections';
import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { DateRange } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, map, switchMap, tap } from 'rxjs';
import { ProjectsService } from 'src/app/api/projects/projects.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { ProjectCellComponent } from 'src/app/shared/components/project-cell/project-cell.component';
import { Page } from 'src/app/shared/types/page.type';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import { Tag } from 'src/app/shared/types/tag.type';
import {
  ElementMenuItems,
  FilteredPaginatedTableComponent,
} from 'src/app/shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { BlockedPillTagComponent } from 'src/app/shared/widget/pill-tag/blocked-pill-tag.component';
import { HostsService } from '../../../api/hosts/hosts.service';
import { SharedModule } from '../../../shared/shared.module';
import { Host } from '../../../shared/types/host/host.interface';
import { HttpStatus } from '../../../shared/types/http-status.type';
import { defaultNewTimeMs } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { HostsInteractionsService } from '../hosts-interactions.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    SharedModule,
    FormsModule,
    MatButtonModule,
    MatTableModule,
    ReactiveFormsModule,
    MatInputModule,
    ProjectCellComponent,
    FilteredPaginatedTableComponent,
    BlockedPillTagComponent,
    RouterModule,
  ],
  selector: 'app-list-hosts',
  templateUrl: './list-hosts.component.html',
  styleUrls: ['./list-hosts.component.scss'],
})
export class ListHostsComponent {
  maxDomainsPerHost = 35;
  dataLoading = true;
  displayedColumns: string[] = ['select', 'ip', 'domains', 'project', 'tags', 'menu'];
  filterOptions: string[] = ['host', 'domain', 'project', 'tags', 'is'];
  public readonly noDataMessage = $localize`:No host found|No host was found:No host found`;

  dataSource = new MatTableDataSource<Host>();
  currentPage: PageEvent = this.generateFirstPageEvent();
  currentFilters: string[] = ['-is: blocked'];
  currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  count = 0;
  selection = new SelectionModel<Host>(true, []);
  currentDateRange: DateRange<Date> = new DateRange<Date>(null, null);
  startDate: Date | null = null;

  dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      const filters = this.buildFilters(this.currentFilters);
      return this.hostsService.getPage(currentPage.pageIndex, currentPage.pageSize, filters, this.currentDateRange);
    }),
    map((data: Page<Host>) => {
      this.dataSource = new MatTableDataSource<Host>(data.items);
      this.count = data.totalRecords;
      this.dataLoading = false;
      return data;
    })
  );

  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(tap((x) => (this.projects = x)));

  tags: Tag[] = [];
  tags$ = this.tagsService.getTags().pipe(
    map((next: any[]) => {
      const tagsArr: Tag[] = [];
      for (const tag of next) {
        tagsArr.push({ _id: tag._id, text: tag.text, color: tag.color });
      }
      this.tags = tagsArr;
      return this.tags;
    })
  );

  // #addHostsDialog template variables
  selectedProject = '';
  selectedNewHosts = '';

  private generateFirstPageEvent() {
    const p = new PageEvent();
    p.pageIndex = 0;
    p.pageSize = 10;
    this.currentPage = p;
    return p;
  }

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public displayColumns$ = this.screenSize$.pipe(
    map((screen: BreakpointState) => {
      if (screen.breakpoints[Breakpoints.XSmall]) return ['select', 'ip', 'project', 'menu'];
      else if (screen.breakpoints[Breakpoints.Small]) return ['select', 'ip', 'project', 'tags', 'menu'];
      else if (screen.breakpoints[Breakpoints.Medium]) return ['select', 'ip', 'domains', 'project', 'tags', 'menu'];
      return this.displayedColumns;
    })
  );

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
  }

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private hostsService: HostsService,
    private hostsInteractor: HostsInteractionsService,
    private toastr: ToastrService,
    private tagsService: TagsService,
    public dialog: MatDialog,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Hosts list page title|:Hosts`);
  }

  filtersChange(filters: string[]) {
    this.currentFilters = filters;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
  }

  dateRangeFilterChange(range: DateRange<Date>) {
    this.currentDateRange = range;
    this.dataLoading = true;
    this.currentPage$.next(this.currentPage);
  }

  buildFilters(stringFilters: string[]): any {
    const SEPARATOR = ':';
    const NEGATING_CHAR = '-';
    const filterObject: any = {};
    const tags = [];
    const domains = [];
    const hosts = [];
    const projects = [];
    let blocked: boolean | null = null;

    for (const filter of stringFilters) {
      if (filter.indexOf(SEPARATOR) === -1) continue;

      const keyValuePair = filter.split(SEPARATOR);

      if (keyValuePair.length !== 2) continue;

      let key = keyValuePair[0].trim().toLowerCase();
      const value = keyValuePair[1].trim().toLowerCase();
      const negated = key.length > 0 && key[0] === NEGATING_CHAR;
      if (negated) key = key.substring(1);

      if (!key || !value) continue;

      switch (key) {
        case 'project':
          const project = this.projects.find((c) => c.name.trim().toLowerCase() === value.trim().toLowerCase());
          if (project) projects.push(project.id);
          else
            this.toastr.warning(
              $localize`:Project does not exist|The given project name is not known to the application:Project name not recognized`
            );
          break;
        case 'host':
          if (value) hosts.push(value.trim().toLowerCase());
          break;
        case 'tags':
          const tag = this.tags.find((t) => t.text.trim().toLowerCase() === value.trim().toLowerCase());
          if (tag) tags.push(tag._id);
          else
            this.toastr.warning(
              $localize`:Tag does not exist|The given tag is not known to the application:Tag not recognized`
            );
          break;
        case 'domain':
          domains.push(value);
          break;
        case 'is':
          switch (value) {
            case 'blocked':
              blocked = !negated;
              break;
          }
          break;
      }
    }
    if (tags?.length) filterObject['tags'] = tags;
    if (domains?.length) filterObject['domain'] = domains;
    if (hosts?.length) filterObject['host'] = hosts;
    if (projects?.length) filterObject['project'] = projects;
    if (blocked !== null) filterObject['blocked'] = blocked;
    return filterObject;
  }

  openNewHostsDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }

  async addNewHosts() {
    if (!this.selectedProject) {
      this.toastr.warning($localize`:Missing project|The data selected is missing the project id:Missing project`);
      return;
    }

    if (!this.selectedNewHosts) {
      this.toastr.warning($localize`:Missing host|The data selected is missing the new hosts:Missing host IPs`);
      return;
    }

    const newHosts: string[] = this.selectedNewHosts
      .split('\n')
      .filter((x) => x != null && x != '')
      .map((x) => x.trim());

    if (newHosts.length == 0) return;

    try {
      const addedHosts = await this.hostsService.addHosts(this.selectedProject, newHosts);
      this.toastr.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);

      if (addedHosts.length < newHosts.length) {
        this.toastr.warning(
          $localize`:Hosts not added|Some hosts were not added to the database:Some hosts were not added`
        );
      }

      this.dialog.closeAll();
      this.currentPage$.next(this.currentPage);
      this.selectedProject = '';
      this.selectedNewHosts = '';
    } catch (err: any) {
      if (err.status === HttpStatus.BadRequest) {
        this.toastr.error(
          $localize`:Check host format|Error while submitting the new hosts to the backend. Most likely a host formatting error:Error submitting hosts, check formats`
        );
      } else {
        throw err;
      }
    }
  }

  private getSelectionAsBulletPoints(): string[] {
    const bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((host: Host) => {
      const projectName = this.projects.find((d) => d.id === host.projectId)?.name;
      const bp = projectName ? `${host.ip} (${projectName})` : `${host.ip}`;
      bulletPoints.push(bp);
    });
    return bulletPoints;
  }

  dateFilter(event: MouseEvent) {
    event.stopPropagation();
    this.startDate = new Date(Date.now() - defaultNewTimeMs);
  }

  public async deleteBatch(hosts: Host[]) {
    const result = await this.hostsInteractor.deleteBatch(hosts, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public async blockBatch(hosts: Host[]) {
    const result = await this.hostsInteractor.blockBatch(hosts, this.projects);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public async block(hostId: string, block: boolean) {
    const result = await this.hostsInteractor.block(hostId, block);
    if (result) {
      this.selection.clear();
      this.currentPage$.next(this.currentPage);
    }
  }

  public generateMenuItem = (element: Host): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: () => this.block(element._id, !element.blocked),
      icon: element.blocked ? 'thumb_up ' : 'block',
      label: element.blocked ? $localize`:Unblock host|Unblock host:Unblock` : $localize`:Block host|Block host:Block`,
    });

    menuItems.push({
      action: () => this.deleteBatch([element]),
      icon: 'delete',
      label: $localize`:Delete host|Delete host:Delete`,
    });

    return menuItems;
  };
}
