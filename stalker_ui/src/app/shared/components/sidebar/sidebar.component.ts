import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/api/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  @Input()
  expanded: boolean = true;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {}
}
