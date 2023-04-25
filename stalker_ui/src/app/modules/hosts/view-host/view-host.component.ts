import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { Port } from 'src/app/shared/types/host/host.interface';
import { Tag } from 'src/app/shared/types/tag.type';
import { SelectItem } from '../../../shared/widget/text-select-menu/text-select-menu.component';

@Component({
  selector: 'app-view-host',
  templateUrl: './view-host.component.html',
  styleUrls: ['./view-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewHostComponent {
  displayedColumns: string[] = ['domainName'];
  public manageTags: string = $localize`:Manage Tags|Manage Tags:Manage Tags`;
  public filterTags: string = $localize`:Filter Tags|Filter Tags:Filter Tags`;

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

  tags: (Tag & SelectItem)[] = [];
  tags$ = this.tagsService.getTags().pipe(
    map((next: any[]) => {
      const tagsArr: (Tag & SelectItem)[] = [];
      for (const tag of next) {
        tagsArr.push({ id: tag._id, text: tag.text, color: tag.color, isSelected: false });
      }
      this.tags = tagsArr;
      return this.tags;
    })
  );

  public hostId$ = this.route.params.pipe(map((params) => params['id'] as string));

  public host$ = this.hostId$.pipe(
    switchMap((hostId) => this.hostsService.get(hostId)),
    tap((host) => this.titleService.setTitle($localize`:Hosts page title|:Hosts · ${host.ip}`))
  );

  public shownDomainsCount$ = new BehaviorSubject(5);
  public domains$ = combineLatest([this.host$, this.shownDomainsCount$]).pipe(
    map(([host, size]) => host.domains.slice(0, size))
  );

  public shownPortsCount$ = new BehaviorSubject(5);
  public ports$ = combineLatest([this.host$, this.shownPortsCount$]).pipe(
    map(([host, size]) => host.ports.slice(0, size))
  );

  public itemSelected(item: SelectItem) {
    console.log(item);
  }

  constructor(
    private route: ActivatedRoute,
    private companiesService: CompaniesService,
    private hostsService: HostsService,
    private tagsService: TagsService,
    private titleService: Title
  ) {}
}
