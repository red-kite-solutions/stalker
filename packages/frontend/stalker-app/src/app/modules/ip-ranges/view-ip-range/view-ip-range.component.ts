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
  firstValueFrom,
  map,
  merge,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { IpRangesService } from '../../../api/ip-ranges/ip-ranges.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
import { Domain } from '../../../shared/types/domain/domain.interface';
import { DomainSummary } from '../../../shared/types/domain/domain.summary';
import { IpRange } from '../../../shared/types/ip-range/ip-range.interface';
import { Ipv4Subnet } from '../../../shared/types/ipv4-subnet';
import { Port } from '../../../shared/types/ports/port.interface';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { Tag } from '../../../shared/types/tag.type';
import { BlockedPillTagComponent } from '../../../shared/widget/pill-tag/blocked-pill-tag.component';
import { NewPillTagComponent } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { TextMenuComponent } from '../../../shared/widget/text-menu/text-menu.component';
import { SelectItem } from '../../../shared/widget/text-select-menu/text-select-menu.component';
import { NumberOfHostsMetric } from '../../dashboard/number-of-hosts-metric/number-of-hosts-metric.component';
import { FindingsModule } from '../../findings/findings.module';
import { IpRangesInteractionsService } from '../ip-ranges-interactions.service';

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
    NumberOfHostsMetric,
  ],
  selector: 'app-view-ipRange',
  templateUrl: './view-ip-range.component.html',
  styleUrls: ['./view-ip-range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewIpRangeComponent implements OnDestroy {
  public menuResizeObserver$?: ResizeObserver;
  public hostFilters: { [key: string]: string | string[] } = {};

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

  public manageTags: string = $localize`:Manage Tags|Manage Tags:Manage Tags`;
  public filterTags: string = $localize`:Filter Tags|Filter Tags:Filter Tags`;
  public emptyTags: string = $localize`:No Tags|List of tags is empty:No Tags Available`;
  public manageIpRangeText: string = $localize`:Manage ip range|Manage the ip range element:Manage ip range`;

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

  public ipRangeId$ = this.route.params.pipe(map((params) => params['id'] as string));
  public ipRangeId = '';
  public ipRange!: IpRange;
  public ipRangeExt!: Ipv4Subnet;

  public ipRangeTagsCache: string[] = [];

  public ipRange$ = this.ipRangeId$.pipe(
    switchMap((ipRangeId) => {
      this.ipRangeId = ipRangeId;
      return this.ipRangesService.get(ipRangeId);
    }),
    tap((ipRange) => {
      this.ipRange = ipRange;
      this.ipRangeExt = new Ipv4Subnet(ipRange.ip, ipRange.mask.toString());
      this.hostFilters = {
        ranges: [ipRange.ip + '/' + ipRange.mask.toString()],
        projects: [ipRange.projectId],
      };
      this.titleService.setTitle($localize`:Ip Ranges page title|:IP Ranges · ${ipRange.ip}/${ipRange.mask}`);
      this.ipRangeTagsCache = ipRange.tags ?? [];
    })
  );

  public ipRangeTagsSubject$ = new BehaviorSubject<string[]>([]);
  public ipRangeTags$ = this.ipRange$.pipe(
    map((ipRange) => {
      return ipRange.tags;
    })
  );

  allTags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  public tagsSelectItems$ = combineLatest([this.ipRangeTags$, this.allTags$]).pipe(
    map(([ipRangeTags, allTags]) => {
      const tags: (Tag & SelectItem)[] = [];
      for (const tag of allTags) {
        if (ipRangeTags && ipRangeTags.includes(tag._id)) {
          tags.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: true });
        } else {
          tags.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: false });
        }
      }
      return tags;
    })
  );

  public mergedTags$ = merge(this.ipRangeTagsSubject$, this.ipRangeTags$);

  public shownDomainsCount$ = new BehaviorSubject(5);
  public hosts$ = combineLatest([this.ipRange$, this.shownDomainsCount$]).pipe(
    map(([ipRange, size]) => []) // TODO: Get hosts to display
  );

  /**
   *
   * @param item A SelectItem, but contains all the attributes of a Tag.
   */
  public async itemSelected(item: SelectItem) {
    try {
      const tagId = <string>item['_id'];
      if (!this.ipRangeId) return;
      const tagIndex = this.ipRangeTagsCache.findIndex((tag: string) => tag === tagId);

      if (tagIndex === -1 && item.color !== undefined) {
        // Tag not found, adding it
        await this.ipRangesService.tag(this.ipRangeId, tagId, true);
        this.ipRangeTagsCache.push(tagId);
      } else {
        // Tag was found, removing it
        await this.ipRangesService.tag(this.ipRangeId, tagId, false);
        this.ipRangeTagsCache.splice(tagIndex, 1);
      }
      this.ipRangeTagsSubject$.next(this.ipRangeTagsCache);
    } catch (err) {
      this.toastr.error($localize`:Error while tagging|Error while tagging an item:Error while tagging`);
    }
  }

  ngOnDestroy(): void {
    if (this.menuResizeObserver$) {
      this.menuResizeObserver$.unobserve(this._managementPanelSection.nativeElement);
    }
  }

  public async delete() {
    const result = await this.ipRangesInteractor.deleteBatch([this.ipRange], this.projects);
    if (result) {
      this.router.navigate(['/ip-ranges']);
    }
  }

  public async block(block: boolean) {
    const result = await this.ipRangesInteractor.block(this.ipRangeId, block);
    if (result) {
      const h = await firstValueFrom(this.ipRangesService.get(this.ipRangeId));
      this.ipRange.blocked = h.blocked;
      this.ipRange.blockedAt = h.blockedAt;
      this.cdr.markForCheck();
    }
  }

  public openHosts() {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/hosts/'], {
        queryParams: {
          f: `-is: blocked+project: ${this.projects.find((p) => p.id === this.ipRange.projectId)?.name}+range: ${this.ipRange.ip}/${this.ipRange.mask}`,
        },
      })
    );
    window.open(url);
  }

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private ipRangesService: IpRangesService,
    private ipRangesInteractor: IpRangesInteractionsService,
    private tagsService: TagsService,
    private titleService: Title,
    private toastr: ToastrService,
    private router: Router,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}
}
