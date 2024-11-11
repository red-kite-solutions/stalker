import { Clipboard } from '@angular/cdk/clipboard';
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
  filter,
  firstValueFrom,
  map,
  merge,
  scan,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { ProjectsService } from 'src/app/api/projects/projects.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import { Tag } from 'src/app/shared/types/tag.type';
import { BlockedPillTagComponent } from 'src/app/shared/widget/pill-tag/blocked-pill-tag.component';
import { TextMenuComponent } from 'src/app/shared/widget/text-menu/text-menu.component';
import { FindingsService } from '../../../api/findings/findings.service';
import { PortsService } from '../../../api/ports/ports.service';
import { WebsitesService } from '../../../api/websites/websites.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
import { Page } from '../../../shared/types/page.type';
import { Website } from '../../../shared/types/websites/website.type';
import { SecureIconComponent } from '../../../shared/widget/dynamic-icons/secure-icon.component';
import { NewPillTagComponent } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { SelectItem } from '../../../shared/widget/text-select-menu/text-select-menu.component';
import { FindingsModule } from '../../findings/findings.module';
import { WebsiteInteractionsService } from '../websites-interactions.service';
import { WebsiteOverviewComponent } from './website-overview/website-overview.component';

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
    FindingsModule,
    WebsiteOverviewComponent,
    SecureIconComponent,
  ],
  selector: 'app-view-website',
  templateUrl: './view-website.component.html',
  styleUrls: ['./view-website.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewWebsiteComponent implements OnDestroy {
  public findingsFilterKeys = ['WebsitePathFinding'];
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
  public manageWebsiteText: string = $localize`:Manage website|Manage the website element:Manage website`;
  public secureConnectionTooltip: string = $localize`:Connection secure|:Connections to this website are encrypted`;
  public insecureConnectionTooltip: string = $localize`:Connection insecure|:Connections to this website are not encrypted`;

  // Drawer
  public currentDetailsId: string | null = null;
  public selectedDomain: DomainSummary | null = null;
  public domainDetails$: Observable<Domain> | null = null;
  public websiteDetails$: Observable<Website> | null = null;
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

  public showAllPorts: { [ip: string]: boolean } = {};
  public showAllHosts: boolean = false;

  public websiteId$ = this.route.params.pipe(map((params) => params['id'] as string));
  public website!: Website;
  public websiteId!: string;
  public website$ = this.websiteId$.pipe(
    tap((id: string) => {
      this.websiteId = id;
    }),
    switchMap((id: string) => {
      return this.websitesService.getWebsite(id);
    }),
    tap((website: Website) => {
      this.website = website;
      this.titleService.setTitle($localize`:Website page title|:Website · ${website.url}`);
    }),
    shareReplay(1)
  );

  public mergedWebsitesPage$ = new BehaviorSubject(0);

  public mergedWebsites$ = combineLatest([this.website$, this.mergedWebsitesPage$]).pipe(
    filter(([website, page]) => {
      return !website.mergedInId;
    }),
    switchMap(([website, page]) => {
      return this.websitesService.getPage(page, 5, { mergedInId: website._id });
    }),
    scan((acc: Page<Website>, value: Page<Website>) => {
      acc.items = acc.items.concat(value.items);
      return acc;
    })
  );

  public mergedInWebsite$ = this.website$.pipe(
    filter((website) => {
      return !!website.mergedInId;
    }),
    switchMap((website: Website) => {
      return this.websitesService.getWebsite(website.mergedInId ?? '');
    })
  );

  public port$ = this.website$.pipe(
    map((website) => website.port),
    shareReplay(1)
  );

  public websiteTagsCache: string[] = [];
  public websiteTagsSubject$ = new BehaviorSubject<string[]>([]);
  public websiteTags$ = this.website$.pipe(
    map((website) => {
      this.websiteTagsCache = website.tags ? website.tags : [];
      return this.websiteTagsCache;
    })
  );

  allTags$ = this.tagsService.getAllTags().pipe(shareReplay(1));

  public tagsSelectItems$ = combineLatest([this.websiteTags$, this.allTags$]).pipe(
    map(([websiteTags, allTags]) => {
      const tagsArr: (Tag & SelectItem)[] = [];
      for (const tag of allTags) {
        if (websiteTags?.includes(tag._id)) {
          tagsArr.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: true });
        } else {
          tagsArr.push({ _id: tag._id, text: tag.text, color: tag.color, isSelected: false });
        }
      }
      return tagsArr;
    })
  );

  public mergedTags$ = merge(this.websiteTagsSubject$, this.websiteTags$);

  /**
   *
   * @param item A SelectItem, but contains all the attributes of a Tag.
   */
  public async itemSelected(item: SelectItem) {
    try {
      const tagId = <string>item['_id'];
      if (!this.websiteId) return;
      const tagIndex = this.websiteTagsCache.findIndex((tag: string) => tag === tagId);

      if (tagIndex === -1 && item.color !== undefined) {
        // Tag not found, adding it
        await this.websitesService.tagWebsite(this.websiteId, tagId, true);
        this.websiteTagsCache.push(tagId);
      } else {
        // Tag was found, removing it
        await this.websitesService.tagWebsite(this.websiteId, tagId, false);
        this.websiteTagsCache.splice(tagIndex, 1);
      }
      this.websiteTagsSubject$.next(this.websiteTagsCache);
    } catch (err) {
      this.toastr.error($localize`:Error while tagging|Error while tagging an item:Error while tagging`);
    }
  }

  ngOnDestroy(): void {
    if (this.menuResizeObserver$) {
      this.menuResizeObserver$.unobserve(this._managementPanelSection.nativeElement);
    }
  }

  public async deleteWebsite() {
    const result = await this.websitesInteractor.deleteBatch([this.website], this.projects);
    if (result) {
      this.router.navigate([`/websites/`]);
    }
  }

  public async blockWebsite(block: boolean) {
    const result = await this.websitesInteractor.block(this.websiteId, block);
    if (result) {
      const p = await firstValueFrom(this.websitesService.getWebsite(this.websiteId));
      this.website.blocked = p.blocked;
      this.website.blockedAt = p.blockedAt;
      this.cdr.markForCheck();
      this.dialog.closeAll();
    }
  }

  public async unmergeWebsite() {
    const result = await this.websitesInteractor.unmerge(this.websiteId);
    if (result) {
      const p = await firstValueFrom(this.websitesService.getWebsite(this.websiteId));
      this.website.mergedInId = undefined;
      this.cdr.markForCheck();
      this.dialog.closeAll();
    }
  }

  constructor(
    private route: ActivatedRoute,
    private projectsService: ProjectsService,
    private tagsService: TagsService,
    private titleService: Title,
    private websitesService: WebsitesService,
    private websitesInteractor: WebsiteInteractionsService,
    private portsService: PortsService,
    private toastr: ToastrService,
    private router: Router,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private findingService: FindingsService,
    private clipboard: Clipboard
  ) {}
}
