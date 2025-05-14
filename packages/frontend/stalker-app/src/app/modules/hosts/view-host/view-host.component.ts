import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  concatMap,
  firstValueFrom,
  map,
  merge,
  scan,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { HostsService } from '../../../api/hosts/hosts.service';
import { PortsService } from '../../../api/ports/ports.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { HasScopesDirective } from '../../../shared/directives/has-scopes.directive';
import { SharedModule } from '../../../shared/shared.module';
import { Domain } from '../../../shared/types/domain/domain.interface';
import { DomainSummary } from '../../../shared/types/domain/domain.summary';
import { Host } from '../../../shared/types/host/host.interface';
import { Page } from '../../../shared/types/page.type';
import { Port, PortNumber } from '../../../shared/types/ports/port.interface';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { Tag } from '../../../shared/types/tag.type';
import { BlockedPillTagComponent } from '../../../shared/widget/pill-tag/blocked-pill-tag.component';
import { NewPillTagComponent } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { PillTagComponent } from '../../../shared/widget/pill-tag/pill-tag.component';
import { TextMenuComponent } from '../../../shared/widget/text-menu/text-menu.component';
import { SelectItem } from '../../../shared/widget/text-select-menu/text-select-menu.component';
import { FindingsModule } from '../../findings/findings.module';
import { HostsInteractionsService } from '../hosts-interactions.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule,
    FindingsModule,
    RouterModule,
    PanelSectionModule,
    AppHeaderComponent,
    MatTooltipModule,
    BlockedPillTagComponent,
    TextMenuComponent,
    PillTagComponent,
    HasScopesDirective,
  ],
  selector: 'app-view-host',
  templateUrl: './view-host.component.html',
  styleUrls: ['./view-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewHostComponent implements OnDestroy {
  public menuResizeObserver$?: ResizeObserver;

  @ViewChild('newPillTag', { read: ElementRef, static: false })
  newPillTag!: NewPillTagComponent;

  @ViewChild('managementPanelSection', { read: ElementRef, static: false })
  set managementPanelSection(managementPanelSection: ElementRef) {
    if (managementPanelSection && !this._managementPanelSection) {
      this._managementPanelSection = managementPanelSection;
      this.menuResizeObserver$ = new ResizeObserver((resize) => {});
      this.menuResizeObserver$.observe(this._managementPanelSection.nativeElement);
    }
  }

  _managementPanelSection!: ElementRef;

  displayedColumns: string[] = ['domainName'];
  public manageTags: string = $localize`:Manage Tags|Manage Tags:Manage Tags`;
  public filterTags: string = $localize`:Filter Tags|Filter Tags:Filter Tags`;
  public emptyTags: string = $localize`:No Tags|List of tags is empty:No Tags Available`;
  public manageHostText: string = $localize`:Manage host|Manage the host element:Manage host`;

  // Drawer
  public currentDetailsId: string | null = null;
  public selectedDomain: DomainSummary | null = null;
  public domainDetails$: Observable<Domain> | null = null;
  public portDetails$: Observable<Port> | null = null;
  public selectedItemCorrelationKey$ = new Subject<string | null>();

  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: ProjectSummary[] = [];
      for (const project of next) {
        comp.push({ id: project._id, name: project.name });
      }
      this.projects = comp;
      return this.projects;
    })
  );

  public hostId$ = this.route.params.pipe(map((params) => params['id'] as string));
  public hostId = '';
  public host!: Host;

  public hostTagsCache: string[] = [];

  public host$ = this.hostId$.pipe(
    switchMap((hostId) => {
      this.hostId = hostId;
      return this.hostsService.get(hostId);
    }),
    tap((host) => {
      this.host = host;
      this.titleService.setTitle($localize`:Hosts page title|:Hosts · ${host.ip}`);
      this.hostTagsCache = host.tags;
    })
  );

  public hostTagsSubject$ = new BehaviorSubject<string[]>([]);
  public hostTags$ = this.host$.pipe(
    map((host) => {
      return host.tags;
    })
  );

  allTags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  public tagsSelectItems$ = combineLatest([this.hostTags$, this.allTags$]).pipe(
    map(([hostTags, allTags]) => {
      const tags: (Tag & SelectItem)[] = [];
      for (const tag of allTags) {
        if (hostTags.includes(tag._id)) {
          tags.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: true });
        } else {
          tags.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: false });
        }
      }
      return tags;
    })
  );

  public mergedTags$ = merge(this.hostTagsSubject$, this.hostTags$);

  public shownDomainsCount$ = new BehaviorSubject(5);
  public domains$ = combineLatest([this.host$, this.shownDomainsCount$]).pipe(
    map(([host, size]) => host.domains.slice(0, size))
  );

  public portPage$ = new BehaviorSubject(-1);
  public ports$ = combineLatest([this.host$, this.portPage$]).pipe(
    concatMap(([host, page]) => {
      const size = page >= 0 ? 100 : 5;
      page = page < 0 ? 0 : page;

      return this.portsService.getPage(page, size, { hostId: host._id }, undefined, 'number');
    }),
    scan((acc: Page<PortNumber>, value: Page<PortNumber>) => {
      const found = new Set<number>();

      const uniq = acc.items.concat(value.items).filter((port) => {
        const alreadyFound = found.has(port.port);
        if (!alreadyFound) found.add(port.port);
        return !alreadyFound;
      });

      return { items: uniq, totalRecords: value.totalRecords };
    }),
    shareReplay(1)
  );

  /**
   *
   * @param item A SelectItem, but contains all the attributes of a Tag.
   */
  public async itemSelected(item: SelectItem) {
    try {
      const tagId = <string>item['_id'];
      if (!this.hostId) return;
      const tagIndex = this.hostTagsCache.findIndex((tag: string) => tag === tagId);

      if (tagIndex === -1 && item.color !== undefined) {
        // Tag not found, adding it
        await this.hostsService.tagHost(this.hostId, tagId, true);
        this.hostTagsCache.push(tagId);
      } else {
        // Tag was found, removing it
        await this.hostsService.tagHost(this.hostId, tagId, false);
        this.hostTagsCache.splice(tagIndex, 1);
      }
      this.hostTagsSubject$.next(this.hostTagsCache);
    } catch (err) {
      this.toastr.error($localize`:Error while tagging|Error while tagging an item:Error while tagging`);
    }
  }

  ngOnDestroy(): void {
    if (this.menuResizeObserver$) {
      this.menuResizeObserver$.unobserve(this._managementPanelSection.nativeElement);
    }
  }

  public async deleteHost() {
    const result = await this.hostsInteractor.deleteBatch([this.host], this.projects);
    if (result) {
      this.router.navigate(['/hosts/']);
    }
  }

  public async blockHost(block: boolean) {
    const result = await this.hostsInteractor.block(this.hostId, block);
    if (result) {
      const h = await firstValueFrom(this.hostsService.get(this.hostId));
      this.host.blocked = h.blocked;
      this.host.blockedAt = h.blockedAt;
      this.cdr.markForCheck();
    }
  }

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private hostsService: HostsService,
    private hostsInteractor: HostsInteractionsService,
    private tagsService: TagsService,
    private titleService: Title,
    private toastr: ToastrService,
    private portsService: PortsService,
    private router: Router,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}
}
