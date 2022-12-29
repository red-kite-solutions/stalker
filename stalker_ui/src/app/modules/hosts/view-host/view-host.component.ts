import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { Port } from 'src/app/shared/types/host/host.interface';
import { Tag } from 'src/app/shared/types/tag.type';

@Component({
  selector: 'app-view-host',
  templateUrl: './view-host.component.html',
  styleUrls: ['./view-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewHostComponent {
  displayedColumns: string[] = ['domainName'];

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

  tags: Tag[] = [];
  tags$ = this.tagsService.getTags().pipe(
    map((next: any[]) => {
      const tagsArr: Tag[] = [];
      for (const tag of next) {
        tagsArr.push({ id: tag._id, text: tag.text, color: tag.color });
      }
      this.tags = tagsArr;
      return this.tags;
    })
  );

  public hostId$ = this.route.params.pipe(map((params) => params['id'] as string));

  public host$ = this.hostId$.pipe(switchMap((hostId) => this.hostsService.get(hostId)));

  public shownDomainsCount$ = new BehaviorSubject(3);
  public domains$ = combineLatest([this.host$, this.shownDomainsCount$]).pipe(
    map(([host, size]) => host.domains.slice(0, size))
  );

  public shownPortsCount$ = new BehaviorSubject(3);
  public ports$ = combineLatest([this.host$, this.shownPortsCount$]).pipe(
    map(([host, size]) => host.ports.slice(0, size))
  );

  constructor(
    private route: ActivatedRoute,
    private companiesService: CompaniesService,
    private hostsService: HostsService,
    private domainsService: DomainsService,
    private tagsService: TagsService
  ) {}

  public selectDomainAndView(domain: DomainSummary) {
    if (domain == null) return;

    const previouslySelectedId = this.currentDetailsId;
    this.clearDetails();

    if (previouslySelectedId == domain.id) {
      return;
    }

    this.currentDetailsId = domain.id;
    this.domainDetails$ = this.domainsService
      .get(domain.id)
      .pipe(tap((domain) => this.selectedItemCorrelationKey$.next(domain.correlationKey)));
  }

  public selectPortAndView(port: Port) {
    if (port == null) return;

    const previouslySelectedId = this.currentDetailsId;
    this.clearDetails();

    if (previouslySelectedId == port.id) {
      return;
    }

    this.currentDetailsId = port.id;
    this.portDetails$ = of(port);
    this.selectedItemCorrelationKey$.next(port.correlationKey);
  }

  private clearDetails() {
    this.currentDetailsId = null;
    this.portDetails$ = null;
    this.domainDetails$ = null;
    this.selectedItemCorrelationKey$.next(null);
  }
}
