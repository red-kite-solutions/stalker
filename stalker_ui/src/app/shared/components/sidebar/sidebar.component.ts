import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { Component, Input } from '@angular/core';
import { map } from 'rxjs';
import { AuthService } from 'src/app/api/auth/auth.service';

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
  companies = $localize`:Companies|Multiple businesses:Companies`;
  domains = $localize`:Domains|A domain name:Domains`;
  tags = $localize`:Tags|An item's tags:Tags`;
  subscriptions = $localize`:Subscriptions|The jobs automation process to subscribe to finding events:Subscriptions`;
  hosts = $localize`:Hosts|Hosts:Hosts`;
  customJobs = $localize`:Custom Jobs|Custom Jobs:Custom Jobs`;
  launchJobs = $localize`:Launch Jobs|Launch Jobs:Launch Jobs`;
  jobExecutions = $localize`:Job executions|Job Executions:Job Executions`;

  isSmallScreen$ = this.responsive
    .observe([Breakpoints.XSmall, Breakpoints.Small])
    .pipe(map((x: BreakpointState) => x.matches));

  constructor(public authService: AuthService, private responsive: BreakpointObserver) {}
}
