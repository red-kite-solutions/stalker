import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, map, merge, Observable, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { TagsService } from 'src/app/api/tags/tags.service';
import { CompanySummary } from 'src/app/shared/types/company/company.summary';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { DomainSummary } from 'src/app/shared/types/domain/domain.summary';
import { Port, PortNumber } from 'src/app/shared/types/ports/port.interface';
import { Tag } from 'src/app/shared/types/tag.type';
import { PortsService } from '../../../api/ports/ports.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
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
  selector: 'app-view-port',
  templateUrl: './view-port.component.html',
  styleUrls: ['./view-port.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPortComponent implements OnDestroy {
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

  public hostId = '';
  public hostId$ = this.route.params.pipe(
    map((params) => {
      this.hostId = params['id'] as string;
      return this.hostId;
    })
  );
  public portNumber$ = this.route.params.pipe(map((params) => params['port'] as string));

  public host$ = this.hostId$.pipe(switchMap((hostId) => this.hostsService.get(hostId)));

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

  public portId = '';
  public port$ = combineLatest([this.ports$, this.portTitle$]).pipe(
    map(([ports, portNumber]) => ports.find((p) => p.port === +portNumber)),
    switchMap((port: PortNumber | undefined) => {
      if (port) {
        this.portId = port._id;
        return this.portsService.getPort(port._id);
      }
      throw new Error('Error getting the port');
    }),
    shareReplay(1)
  );

  public portTagsCache: string[] = [];
  public portTagsSubject$ = new BehaviorSubject<string[]>([]);
  public portTags$ = this.port$.pipe(
    map((port) => {
      this.portTagsCache = port.tags ? port.tags : [];
      return this.portTagsCache;
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

  public tagsSelectItems$ = combineLatest([this.portTags$, this.allTags$]).pipe(
    map(([portTags, allTags]) => {
      const tagsArr: (Tag & SelectItem)[] = [];
      for (const tag of allTags) {
        if (portTags?.includes(tag.id)) {
          tagsArr.push({ id: tag.id, text: tag.text, color: tag.color, isSelected: true });
        } else {
          tagsArr.push({ id: tag.id, text: tag.text, color: tag.color, isSelected: false });
        }
      }
      this.tags = tagsArr;
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
      const tagId = <string>item['id'];
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
    const errorDeleting = $localize`:Error while deleting|Error while deleting an item:Error while deleting`;
    if (!this.portId) {
      this.toastr.error(errorDeleting);
    }

    const data: ConfirmDialogData = {
      text: $localize`:Confirm port deletion|Confirmation message asking if the user really wants to delete the port:Do you really wish to delete this port permanently ?`,
      title: $localize`:Deleting port|Title of a page to delete a port:Deleting port`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        try {
          await this.portsService.delete(this.portId);
          this.toastr.success(
            $localize`:Port deleted|The port has been successfully deleted:Port successfully deleted`
          );
          this.router.navigate([`/hosts/${this.hostId}`]);
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
    private companiesService: CompaniesService,
    private hostsService: HostsService,
    private tagsService: TagsService,
    private titleService: Title,
    private portsService: PortsService,
    private toastr: ToastrService,
    private router: Router,
    public dialog: MatDialog
  ) {}
}
