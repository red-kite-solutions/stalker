import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/api/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input()
  expanded = true;
  public dashboard = $localize`:Dashboard|The application's dashboard:Dashboard`;
  public users = $localize`:Users|Users list page title:Users`;
  public settings = $localize`:Settings|Settings page title to edit the application configuration:Settings`;
  public companies = $localize`:Companies|Multiple businesses:Companies`;
  public domains = $localize`:Domains|A domain name:Domains`;
  public tags = $localize`:Tags|An item's tags:Tags`;

  constructor(public authService: AuthService) {}
}
