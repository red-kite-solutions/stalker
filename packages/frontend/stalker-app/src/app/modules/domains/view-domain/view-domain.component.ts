import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
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
import { DomainsService } from '../../../api/domains/domains.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { TagsService } from '../../../api/tags/tags.service';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { Tag } from '../../../shared/types/tag.type';
import { BlockedPillTagComponent } from '../../../shared/widget/pill-tag/blocked-pill-tag.component';
import { TextMenuComponent } from '../../../shared/widget/text-menu/text-menu.component';
import { PortsService } from '../../../api/ports/ports.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
import { Domain } from '../../../shared/types/domain/domain.interface';
import { Page } from '../../../shared/types/page.type';
import { PortNumber } from '../../../shared/types/ports/port.interface';
import { NewPillTagComponent } from '../../../shared/widget/pill-tag/new-pill-tag.component';
import { SelectItem } from '../../../shared/widget/text-select-menu/text-select-menu.component';
import { FindingsModule } from '../../findings/findings.module';
import { DomainsInteractionsService } from '../domains-interactions.service';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    AppHeaderComponent,
    FindingsModule,
    PanelSectionModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    TextMenuComponent,
    BlockedPillTagComponent,
  ],
  selector: 'app-view-domain',
  templateUrl: './view-domain.component.html',
  styleUrls: ['./view-domain.component.scss'],
})
export class ViewDomainComponent implements OnDestroy {
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

  public routeLoading = false;
  displayedColumns: string[] = ['ipAddress', 'ports'];
  public manageTags: string = $localize`:Manage Tags|Manage Tags:Manage Tags`;
  public filterTags: string = $localize`:Filter Tags|Filter Tags:Filter Tags`;
  public emptyTags: string = $localize`:No Tags|List of tags is empty:No Tags Available`;
  public manageDomainText: string = $localize`:Manage domain|Manage the domain name element:Manage domain`;

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

  public domainId = '';
  public domain!: Domain;
  public domainTagsCache: string[] = [];
  public domain$ = this.route.params.pipe(
    switchMap((params) => {
      this.domainId = params['id'];
      return this.domainsService.get(params['id']);
    }),
    tap((domain: Domain) => {
      this.titleService.setTitle($localize`:Domain page title|:Domains · ${domain.name}`);
      this.domainTagsCache = domain.tags;
      this.domain = domain;
    }),
    shareReplay(1)
  );
  public domainTagsSubject$ = new BehaviorSubject<string[]>([]);
  public domainTags$ = this.domain$.pipe(
    map((domain) => {
      return domain.tags;
    })
  );

  allTags$ = this.tagsService.getAllTags().pipe(shareReplay(1));
  public tagsSelectItems$ = combineLatest([this.domainTags$, this.allTags$]).pipe(
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

  public mergedTags$ = merge(this.domainTagsSubject$, this.domainTags$);

  public showAllPorts: { [ip: string]: boolean } = {};

  public ipAddressesDataSourceShowCount$ = new BehaviorSubject(8);
  public ipAddresses$ = combineLatest([this.domain$, this.ipAddressesDataSourceShowCount$]).pipe(
    map(([domain, size]) =>
      domain.hosts
        .map((h) => {
          const ports$ = this.getPorts(h.id);
          return {
            ...h,
            portsSubset$: ports$.pipe(map((p) => p.slice(0, 12))),
            ports$: ports$,
            numberOfPorts$: ports$.pipe(map((p) => p.length)),
          };
        })
        .slice(0, size)
    )
  );

  private getPorts(hostId: string) {
    const pageSize = 100;
    const page$ = new BehaviorSubject<number>(0);
    return page$.pipe(
      concatMap((page: number) => {
        return this.portsService.getPage(page, pageSize, { hostId: hostId }, undefined, 'number');
      }),
      scan((acc: Page<PortNumber>, value: Page<PortNumber>) => {
        return { items: acc.items.concat(value.items), totalRecords: value.totalRecords };
      }),
      tap((ports: Page<PortNumber>) => {
        if (ports.items.length < ports.totalRecords) page$.next(page$.value + 1);
      }),
      map((ports: Page<PortNumber>) => ports.items.sort((a, b) => a.port - b.port))
    );
  }

  ngOnDestroy(): void {
    if (this.menuResizeObserver$) {
      this.menuResizeObserver$.unobserve(this._managementPanelSection.nativeElement);
    }
  }

  /**
   * @param item A SelectItem, but contains all the attributes of a Tag.
   */
  public async itemSelected(item: SelectItem) {
    try {
      const tagId = <string>item['_id'];
      if (!this.domainId) return;
      const tagIndex = this.domainTagsCache.findIndex((tag: string) => tag === tagId);

      if (tagIndex === -1 && item.color !== undefined) {
        // Tag not found, adding it
        await this.domainsService.tagDomain(this.domainId, tagId, true);
        this.domainTagsCache.push(tagId);
      } else {
        // Tag was found, removing it
        await this.domainsService.tagDomain(this.domainId, tagId, false);
        this.domainTagsCache.splice(tagIndex, 1);
      }
      this.domainTagsSubject$.next(this.domainTagsCache);
    } catch (err) {
      this.toastr.error($localize`:Error while tagging|Error while tagging an item:Error while tagging`);
    }
  }

  public async deleteDomain() {
    const domain = await firstValueFrom(this.domain$);
    const result = await this.domainsInteractor.deleteBatch([domain], this.projects);

    if (result) {
      this.router.navigate(['/domains/']);
    }
  }

  public async blockDomain(block: boolean) {
    const result = await this.domainsInteractor.block(this.domainId, block);
    if (result) {
      const d = await firstValueFrom(this.domainsService.get(this.domainId));
      this.domain.blocked = d.blocked;
      this.domain.blockedAt = d.blockedAt;

      this.cdr.markForCheck();
    }
  }

  constructor(
    private route: ActivatedRoute,
    private domainsService: DomainsService,
    private domainsInteractor: DomainsInteractionsService,
    private projectsService: ProjectsService,
    private tagsService: TagsService,
    private titleService: Title,
    private toastr: ToastrService,
    private portsService: PortsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
}
