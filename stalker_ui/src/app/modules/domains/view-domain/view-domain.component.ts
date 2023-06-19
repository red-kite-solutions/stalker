import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, map, merge, shareReplay, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Tag } from 'src/app/shared/types/tag.type';
import { PortsService } from '../../../api/ports/ports.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
import { Domain } from '../../../shared/types/domain/domain.interface';
import { PortNumber } from '../../../shared/types/ports/port.interface';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/widget/confirm-dialog/confirm-dialog.component';
import { SelectItem } from '../../../shared/widget/text-select-menu/text-select-menu.component';
import { FindingsModule } from '../../findings/findings.module';

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
  ],
  selector: 'app-view-domain',
  templateUrl: './view-domain.component.html',
  styleUrls: ['./view-domain.component.scss'],
})
export class ViewDomainComponent implements OnDestroy {
  public menuTargetWidth = 100;
  public menuResizeObserver$?: ResizeObserver;

  @ViewChild('managementPanelSection', { read: ElementRef, static: false })
  set managementPanelSection(managementPanelSection: ElementRef) {
    if (managementPanelSection && !this._managementPanelSection) {
      this._managementPanelSection = managementPanelSection;
      this.menuResizeObserver$ = new ResizeObserver((resize) => {
        this.menuTargetWidth = resize[0].contentRect.width;
      });
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

  companies: CompanySummary[] = [];
  companies$ = this.companiesService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: CompanySummary[] = [];
      for (const company of next) {
        comp.push({ id: company._id, name: company.name });
      }
      this.companies = comp;
      return this.companies;
    })
  );

  public domainId = '';
  public domainTagsCache: string[] = [];
  public domain$ = this.route.params.pipe(
    switchMap((params) => {
      this.domainId = params['id'];
      return this.domainsService.get(params['id']);
    }),
    tap((domain: Domain) => {
      this.titleService.setTitle($localize`:Domain page title|:Domains · ${domain.name}`);
      this.domainTagsCache = domain.tags;
    }),
    shareReplay(1)
  );
  public domainTagsSubject$ = new BehaviorSubject<string[]>([]);
  public domainTags$ = this.domain$.pipe(
    map((domain) => {
      return domain.tags;
    })
  );

  tags: (Tag & SelectItem)[] = [];
  allTags$ = this.tagsService.getTags().pipe(
    map((next: any[]) => {
      const tagsArr: Tag[] = [];
      for (const tag of next) {
        tagsArr.push({ id: tag._id, text: tag.text, color: tag.color });
      }
      return tagsArr;
    })
  );

  public tagsSelectItems$ = combineLatest([this.domainTags$, this.allTags$]).pipe(
    map(([hostTags, allTags]) => {
      const tagsArr: (Tag & SelectItem)[] = [];
      for (const tag of allTags) {
        if (hostTags.includes(tag.id)) {
          tagsArr.push({ id: tag.id, text: tag.text, color: tag.color, isSelected: true });
        } else {
          tagsArr.push({ id: tag.id, text: tag.text, color: tag.color, isSelected: false });
        }
      }
      this.tags = tagsArr;
      return tagsArr;
    })
  );

  public mergedTags$ = merge(this.domainTagsSubject$, this.domainTags$);

  public showAllPorts: { [ip: string]: boolean } = {};

  public ipAddressesDataSourceShowCount$ = new BehaviorSubject(8);
  public ipAddresses$ = combineLatest([this.domain$, this.ipAddressesDataSourceShowCount$]).pipe(
    map(([domain, size]) =>
      domain.hosts
        .map((h) => {
          const ports$ = this.getTopPorts(h.id);
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

  private getTopPorts(hostId: string) {
    return this.portsService.getPorts(hostId, 0, 65535, { sortType: 'popularity' }).pipe(
      map((ports: PortNumber[]) => ports.sort((a, b) => a.port - b.port)),
      shareReplay(1)
    );
  }

  ngOnDestroy(): void {
    if (this.menuResizeObserver$) {
      this.menuResizeObserver$.unobserve(this._managementPanelSection.nativeElement);
    }
  }

  /**
   *
   * @param item A SelectItem, but contains all the attributes of a Tag.
   */
  public async itemSelected(item: SelectItem) {
    try {
      const tagId = <string>item['id'];
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
    const errorDeleting = $localize`:Error while deleting|Error while deleting an item:Error while deleting`;
    if (!this.domainId) {
      this.toastr.error(errorDeleting);
    }

    const data: ConfirmDialogData = {
      text: $localize`:Confirm domain deletion|Confirmation message asking if the user really wants to delete the domain:Do you really wish to delete this domain permanently ?`,
      title: $localize`:Deleting domain|Title of a page to delete a domain:Deleting domain`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        try {
          await this.domainsService.delete(this.domainId);
          this.toastr.success(
            $localize`:Domain deleted|The domain has been successfully deleted:Domain successfully deleted`
          );
          this.router.navigate(['/hosts/']);
          this.dialog.closeAll();
        } catch (err) {
          this.toastr.error(errorDeleting);
        }
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  constructor(
    private route: ActivatedRoute,
    private domainsService: DomainsService,
    private companiesService: CompaniesService,
    private tagsService: TagsService,
    private titleService: Title,
    private toastr: ToastrService,
    private portsService: PortsService,
    private router: Router,
    public dialog: MatDialog
  ) {}
}
