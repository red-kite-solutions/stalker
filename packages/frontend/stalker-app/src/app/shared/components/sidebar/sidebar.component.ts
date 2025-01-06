import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { Component, Input } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input()
  expanded = true;

  dashboard = $localize`:Dashboard|The application's dashboard:Dashboard`;
  users = $localize`:Users|Users list page title:Users`;
  settings = $localize`:Settings|Settings page title to edit the application configuration:Settings`;
  projects = $localize`:Projects|Multiple businesses:Projects`;
  domains = $localize`:Domains|A domain name:Domains`;
  tags = $localize`:Tags|An item's tags:Tags`;
  subscriptions = $localize`:Subscriptions|The jobs automation process to subscribe to finding events:Subscriptions`;
  hosts = $localize`:Hosts|Hosts:Hosts`;
  customJobs = $localize`:Custom jobs|Custom jobs:Custom jobs`;
  launchJobs = $localize`:Launch jobs|Launch jobs:Launch jobs`;
  jobExecutions = $localize`:Job executions|Job executions:Job executions`;
  secrets = $localize`:Secrets|Secrets to inject in jobs:Secrets`;
  ports = $localize`:Ports|Host's ports:Ports`;
  websites = $localize`:Websites|Website:Websites`;

  isSmallScreen$ = this.responsive
    .observe([Breakpoints.XSmall, Breakpoints.Small])
    .pipe(map((x: BreakpointState) => x.matches));

  constructor(
    public authService: AuthService,
    private responsive: BreakpointObserver
  ) {}
}
