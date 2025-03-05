import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { isObservable, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../api/auth/auth.service';
import { TablesService } from '../../../api/tables/tables.service';

interface Section {
  name: string | undefined;
  items: (BasicSectionItem | AggregateSectionItem | Observable<BasicSectionItem | AggregateSectionItem>)[];
}

interface BasicSectionItem {
  name: string;
  icon: string;
  isAdmin?: boolean;
  routerLink: string;
  filled?: boolean;
  isVisible?: boolean;
}

interface AggregateSectionItem {
  name: string;
  icon: string;
  isAdmin?: boolean;
  isVisible?: boolean;
  items: BasicSectionItem[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  @Input()
  expanded = true;

  sections: Section[] = [
    {
      name: $localize`:Visualization|Title for the Visualization section of the sidenav:Visualization`,
      items: [
        {
          icon: 'dashboard',
          routerLink: '/',
          name: $localize`:Dashboard|Sidenav dashboard button:Dashboard`,
        },
        this.tablesService.getTables().pipe(
          map((tables) => ({
            icon: 'table',
            isVisible: !environment.production,
            name: $localize`:Tables|Tables button:Tables`,
            items: tables.map((v) => ({
              ...v,
              routerLink: `/tables/${v.id}`,
            })),
          }))
        ),
      ],
    },
    {
      name: $localize`:Resources|Title for the Resources section of the sidenav:Resources`,
      items: [
        {
          icon: 'radar',
          routerLink: '/ip-ranges',
          name: $localize`:IP Ranges|Sidenav ip ranges button:IP Ranges`,
        },
        {
          icon: 'language',
          routerLink: '/domains',
          name: $localize`:Domains|Sidenav domain button:Domains`,
        },
        {
          icon: 'storage',
          routerLink: '/hosts',
          name: $localize`:Hosts|Sidenav hosts button:Hosts`,
        },
        {
          icon: 'fingerprints',
          routerLink: '/ports',
          name: $localize`:Ports|Sidenav host ports button:Ports`,
        },
        {
          icon: 'web',
          routerLink: '/websites',
          name: $localize`:Websites|Sidenav website button:Websites`,
        },
      ],
    },
    {
      name: $localize`:Automation|Title for the Automation section of the sidenav:Automation`,
      items: [
        {
          icon: 'precision_manufacturing',
          routerLink: '/jobs/subscriptions',
          name: $localize`:Subscriptions|Sidenav button for subscriptions:Subscriptions`,
        },
        {
          icon: 'coffee',
          routerLink: '/jobs/custom',
          name: $localize`:Jobs|Sidenav button for jobs:Jobs`,
        },
        {
          icon: 'rocket_launch',
          routerLink: '/jobs/launch',
          name: $localize`:Launch|Sidenav button for launch jobs:Launch`,
        },
        {
          icon: 'play_circle',
          routerLink: '/jobs/executions',
          name: $localize`:Executions|Sidenav button for job executions:Executions `,
        },
      ],
    },
    {
      name: $localize`:Management|Title for the Management section of the sidenav:Management`,
      items: [
        {
          icon: 'folder_open',
          routerLink: '/projects',
          name: $localize`:Projects|Sidenav button for projects:Projects`,
        },
        {
          icon: 'sell',
          routerLink: '/tags',
          name: $localize`:Tags|Sidenav button for tags:Tags`,
        },
        {
          icon: 'password',
          routerLink: '/secrets',
          name: $localize`:Secrets|Sidenav button for secrets:Secrets`,
        },
        {
          icon: 'manage_accounts',
          routerLink: '/admin/users',
          name: $localize`:Users|Users list page title:Users`,
        },
      ],
    },
  ];

  isSmallScreen$ = this.responsive
    .observe([Breakpoints.XSmall, Breakpoints.Small])
    .pipe(map((x: BreakpointState) => x.matches));

  constructor(
    public authService: AuthService,
    private tablesService: TablesService,
    private responsive: BreakpointObserver
  ) {}

  isBasicSectionItem(basicOrAggregate: BasicSectionItem | AggregateSectionItem): basicOrAggregate is BasicSectionItem {
    return 'routerLink' in basicOrAggregate;
  }

  asObservable(
    item: BasicSectionItem | AggregateSectionItem | Observable<BasicSectionItem | AggregateSectionItem>
  ): Observable<BasicSectionItem | AggregateSectionItem> {
    if (isObservable(item)) return item;

    return of(item);
  }

  shouldDisplay(item: BasicSectionItem | AggregateSectionItem) {
    if (item.isVisible === false) return false;

    return !item.isAdmin || this.authService.role === 'admin';
  }
}
