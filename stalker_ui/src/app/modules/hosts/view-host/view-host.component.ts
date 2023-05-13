import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, map, merge, Observable, Subject, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { Port } from 'src/app/shared/types/ports/port.interface';
import { Tag } from 'src/app/shared/types/tag.type';
import { PortsService } from '../../../api/ports/ports.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
import { SelectItem } from '../../../shared/widget/text-select-menu/text-select-menu.component';
import { FindingsModule } from '../../findings/findings.module';

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
    FormsModule,
    FindingsModule,
    RouterModule,
    PanelSectionModule,
    AppHeaderComponent,
  ],
  selector: 'app-view-host',
  templateUrl: './view-host.component.html',
  styleUrls: ['./view-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewHostComponent {
  displayedColumns: string[] = ['domainName'];
  public manageTags: string = $localize`:Manage Tags|Manage Tags:Manage Tags`;
  public filterTags: string = $localize`:Filter Tags|Filter Tags:Filter Tags`;
  public emptyTags: string = $localize`:No Tags|List of tags is empty:No Tags Available`;

  // Drawer
  public currentDetailsId: string | null = null;
  public selectedDomain: DomainSummary | null = null;
  public domainDetails$: Observable<Domain> | null = null;
  public portDetails$: Observable<Port> | null = null;
  public selectedItemCorrelationKey$ = new Subject<string | null>();

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

  public hostId$ = this.route.params.pipe(map((params) => params['id'] as string));
  public hostId = '';

  public hostTagsCache: string[] = [];
  public host$ = this.hostId$.pipe(
    switchMap((hostId) => {
      this.hostId = hostId;
      return this.hostsService.get(hostId);
    }),
    tap((host) => {
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

  public tagsSelectItems$ = combineLatest([this.hostTags$, this.allTags$]).pipe(
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

  public mergedTags$ = merge(this.hostTagsSubject$, this.hostTags$);

  public shownDomainsCount$ = new BehaviorSubject(5);
  public domains$ = combineLatest([this.host$, this.shownDomainsCount$]).pipe(
    map(([host, size]) => host.domains.slice(0, size))
  );

  public shownPortsCount$ = new BehaviorSubject(5);
  public ports$ = combineLatest([this.host$, this.shownPortsCount$]).pipe(
    switchMap(([host, size]) => this.portsService.getPorts(host._id, 0, size, { sortType: 'popularity' }))
  );

  /**
   *
   * @param item A SelectItem, but contains all the attributes of a Tag.
   */
  public async itemSelected(item: SelectItem) {
    try {
      const tagId = <string>item['id'];
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

  constructor(
    private route: ActivatedRoute,
    private companiesService: CompaniesService,
    private hostsService: HostsService,
    private tagsService: TagsService,
    private titleService: Title,
    private toastr: ToastrService,
    private portsService: PortsService
  ) {}
}
