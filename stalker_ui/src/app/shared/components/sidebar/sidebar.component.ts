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

  constructor(public authService: AuthService) {}
}
