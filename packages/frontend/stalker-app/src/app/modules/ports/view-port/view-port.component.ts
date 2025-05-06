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
import { SharedModule } from '../../../shared/shared.module';
import { Domain } from '../../../shared/types/domain/domain.interface';
import { DomainSummary } from '../../../shared/types/domain/domain.summary';
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
import { PortsInteractionsService } from '../ports-interactions.service';

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
    TextMenuComponent,
    BlockedPillTagComponent,
    PillTagComponent,
  ],
  selector: 'app-view-port',
  templateUrl: './view-port.component.html',
  styleUrls: ['./view-port.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPortComponent implements OnDestroy {
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
  public managePortText: string = $localize`:Manage port|Manage the port element:Manage port`;

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

  public hostId = '';
  public hostId$ = this.route.params.pipe(
    map((params) => {
      this.hostId = params['id'] as string;
      return this.hostId;
    })
  );
  public portNumber$ = this.route.params.pipe(map((params) => params['port'] as string));
  public port!: Port;

  public host$ = this.hostId$.pipe(switchMap((hostId) => this.hostsService.get(hostId)));

  public portPage$ = new BehaviorSubject(-1);
  public ports$ = combineLatest([this.host$, this.portPage$]).pipe(
    concatMap(([host, page]) => {
      const size = page >= 0 ? 100 : 5;
      page = page < 0 ? 0 : page;

      return this.portsService.getPage(
        page,
        size,
        [{ type: 'host.id', value: host._id, not: false }],
        undefined,
        'number'
      );
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

  public portTitle$ = combineLatest([this.portNumber$, this.host$]).pipe(
    tap(([portNumber, host]) =>
      this.titleService.setTitle($localize`:Hosts port page title|:Hosts · ${host.ip}\:${portNumber}`)
    ),
    map(([portNumber]) => portNumber),
    shareReplay(1)
  );

  public portId = '';
  public port$ = combineLatest([this.hostId$, this.portNumber$]).pipe(
    switchMap(([hostId, portNumber]) => this.hostsService.getPort(hostId, +portNumber)),
    tap((port) => {
      this.portId = port._id;
    }),
    shareReplay(1),
    tap((p: Port) => (this.port = p))
  );

  public portTagsCache: string[] = [];
  public portTagsSubject$ = new BehaviorSubject<string[]>([]);
  public portTags$ = this.port$.pipe(
    map((port) => {
      this.portTagsCache = port.tags ? port.tags : [];
      return this.portTagsCache;
    })
  );

  allTags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  public tagsSelectItems$ = combineLatest([this.portTags$, this.allTags$]).pipe(
    map(([portTags, allTags]) => {
      const tagsArr: (Tag & SelectItem)[] = [];
      for (const tag of allTags) {
        if (portTags?.includes(tag._id)) {
          tagsArr.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: true });
        } else {
          tagsArr.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: false });
        }
      }
      return tagsArr;
    })
  );

  public mergedTags$ = merge(this.portTagsSubject$, this.portTags$);

  /**
   *
   * @param item A SelectItem, but contains all the attributes of a Tag.
   */
  public async itemSelected(item: SelectItem) {
    try {
      const tagId = <string>item['_id'];
      if (!this.portId) return;
      const tagIndex = this.portTagsCache.findIndex((tag: string) => tag === tagId);

      if (tagIndex === -1 && item.color !== undefined) {
        // Tag not found, adding it
        await this.portsService.tagPort(this.portId, tagId, true);
        this.portTagsCache.push(tagId);
      } else {
        // Tag was found, removing it
        await this.portsService.tagPort(this.portId, tagId, false);
        this.portTagsCache.splice(tagIndex, 1);
      }
      this.portTagsSubject$.next(this.portTagsCache);
    } catch (err) {
      this.toastr.error($localize`:Error while tagging|Error while tagging an item:Error while tagging`);
    }
  }

  ngOnDestroy(): void {
    if (this.menuResizeObserver$) {
      this.menuResizeObserver$.unobserve(this._managementPanelSection.nativeElement);
    }
  }

  public async deletePort() {
    const result = await this.portsInteractor.deleteBatch([this.port], this.projects);
    if (result) {
      this.router.navigate([`/hosts/${this.hostId}`]);
    }
  }

  public async blockPort(block: boolean) {
    const result = await this.portsInteractor.block(this.portId, block);
    if (result) {
      const p = await firstValueFrom(this.portsService.getPort(this.portId));
      this.port.blocked = p.blocked;
      this.port.blockedAt = p.blockedAt;
      this.cdr.markForCheck();
      this.dialog.closeAll();
    }
  }

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private hostsService: HostsService,
    private tagsService: TagsService,
    private titleService: Title,
    private portsService: PortsService,
    private portsInteractor: PortsInteractionsService,
    private toastr: ToastrService,
    private router: Router,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}
}
