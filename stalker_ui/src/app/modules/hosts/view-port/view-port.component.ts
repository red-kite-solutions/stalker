import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { Port } from 'src/app/shared/types/ports/port.interface';
import { Tag } from 'src/app/shared/types/tag.type';
import { PortsService } from '../../../api/ports/ports.service';

@Component({
  selector: 'app-view-port',
  templateUrl: './view-port.component.html',
  styleUrls: ['./view-port.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPortComponent {
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
  public portNumber$ = this.route.params.pipe(map((params) => params['port'] as string));

  public host$ = this.hostId$.pipe(
    switchMap((hostId) => this.hostsService.get(hostId)),
    shareReplay(1)
  );

  public shownPortsCount$ = new BehaviorSubject(5);
  public ports$ = combineLatest([this.host$, this.shownPortsCount$]).pipe(
    switchMap(([host, size]) => this.portsService.getPorts(host._id, 0, size, { sortType: 'popularity' }))
  );

  public portTitle$ = combineLatest([this.portNumber$, this.host$]).pipe(
    tap(([portNumber, host]) =>
      this.titleService.setTitle($localize`:Hosts port page title|:Hosts · ${host.ip}\:${portNumber}`)
    ),
    map(([portNumber]) => portNumber),
    shareReplay(1)
  );

  public port$ = combineLatest([this.ports$, this.portTitle$]).pipe(
    map(([ports, portNumber]) => ports.find((p) => p.port === +portNumber)),
    shareReplay(1)
  );

  constructor(
    private route: ActivatedRoute,
    private companiesService: CompaniesService,
    private hostsService: HostsService,
    private tagsService: TagsService,
    private titleService: Title,
    private portsService: PortsService
  ) {}
}
