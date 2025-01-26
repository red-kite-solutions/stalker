import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { Component, Input } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';

interface Section {
  name: string | undefined;
  items: SectionItem[];
}

interface SectionItem {
  name: string;
  icon: string;
  isAdmin?: boolean;
  routerLink: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input()
  expanded = true;

  sections: Section[] = [
    {
      name: undefined,
      items: [
        {
          icon: 'dashboard',
          routerLink: '/',
          name: $localize`:Dashboard|Sidenav dashboard button:Dashboard`,
        },
      ],
    },
    {
      name: $localize`:Resources|Title for the Resources section of the sidenav:Resources`,
      items: [
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
          routerLink: '/subscriptions',
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
    private responsive: BreakpointObserver
  ) {}
}
