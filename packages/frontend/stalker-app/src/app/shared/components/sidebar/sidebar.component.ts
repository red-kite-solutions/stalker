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

interface SectionItem {
  name: string;
  icon: string;
  isVisible?: boolean;
  requiredScopes?: string[];
}

interface BasicSectionItem extends SectionItem {
  routerLink: string;
  filled?: boolean;
}

interface AggregateSectionItem extends SectionItem {
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
        this.tablesService.getTables().pipe<AggregateSectionItem>(
          map((tables) => ({
            icon: 'table',
            isVisible: !environment.production,
            name: $localize`:Tables|Tables button:Tables`,
            requiredScopes: ['data:findings:read'],
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
          icon: 'language',
          routerLink: '/domains',
          name: $localize`:Domains|Sidenav domain button:Domains`,
          requiredScopes: ['resources:domains:read'],
        },
        {
          icon: 'storage',
          routerLink: '/hosts',
          name: $localize`:Hosts|Sidenav hosts button:Hosts`,
          requiredScopes: ['resources:hosts:read'],
        },
        {
          icon: 'fingerprints',
          routerLink: '/ports',
          name: $localize`:Ports|Sidenav host ports button:Ports`,
          requiredScopes: ['resources:ports:read'],
        },
        {
          icon: 'web',
          routerLink: '/websites',
          name: $localize`:Websites|Sidenav website button:Websites`,
          requiredScopes: ['resources:websites:read'],
        },
        {
          icon: 'radar',
          routerLink: '/ip-ranges',
          name: $localize`:IP Ranges|Sidenav ip ranges button:IP Ranges`,
          requiredScopes: ['resources:ip-ranges:read'],
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
          requiredScopes: ['automation:subscriptions:read'],
        },
        {
          icon: 'coffee',
          routerLink: '/jobs/custom',
          name: $localize`:Jobs|Sidenav button for jobs:Jobs`,
          requiredScopes: ['automation:custom-jobs:read'],
        },
        {
          icon: 'rocket_launch',
          routerLink: '/jobs/launch',
          name: $localize`:Launch|Sidenav button for launch jobs:Launch`,
          requiredScopes: ['automation:job-executions:create', 'automation:custom-jobs:read'],
        },
        {
          icon: 'play_circle',
          routerLink: '/jobs/executions',
          name: $localize`:Executions|Sidenav button for job executions:Executions `,
          requiredScopes: ['automation:job-executions:read'],
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
          requiredScopes: ['manage:projects:read'],
        },
        {
          icon: 'sell',
          routerLink: '/tags',
          name: $localize`:Tags|Sidenav button for tags:Tags`,
          requiredScopes: ['manage:tags:read'],
        },
        {
          icon: 'password',
          routerLink: '/secrets',
          name: $localize`:Secrets|Sidenav button for secrets:Secrets`,
          requiredScopes: ['manage:secrets:read'],
        },
        {
          icon: 'manage_accounts',
          routerLink: '/admin/users',
          name: $localize`:Users|Users list page title:Users`,
          requiredScopes: ['manage:users:read-all'],
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

  shouldDisplaySection(section: Section) {
    if (!section || !section.items) return false;

    for (const item of section.items) {
      if (isObservable(item)) return true;
      if (this.shouldDisplay(item)) return true;
    }
    return false;
  }

  /**
   * Tells if an `AggregateSectionItem` should be displayed according to its `BasicSectionItem`s' scopes.
   * @param item
   * @returns
   */
  private shouldDisplayAggregate(item: AggregateSectionItem) {
    if (!this.authService.userHasOneScopeOf(item.requiredScopes)) return false;

    const allSubScopes = [];
    for (const agItem of item.items) {
      if (agItem.requiredScopes) allSubScopes.push(...agItem.requiredScopes);
      else return true; // If an item does not require any scopes, we want to display it
    }

    return this.authService.userHasOneScopeOf(allSubScopes);
  }

  /**
   *
   * @param item
   * @returns
   */
  shouldDisplay(item: BasicSectionItem | AggregateSectionItem) {
    if (item.isVisible === false) return false;

    if ('items' in item) {
      return this.shouldDisplayAggregate(item);
    }

    if (!item.requiredScopes) return true;

    return this.authService.userHasAllScopesOf(item.requiredScopes);
  }
}
