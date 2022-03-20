import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/api/auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @Output()
  toggleSideBarEvent: EventEmitter<any> = new EventEmitter();

  public email: string = '';

  constructor(private authService: AuthService, private router: Router) {
    this.email = this.authService.email;
  }

  ngOnInit(): void {}

  toggleSideBar() {
    this.toggleSideBarEvent.emit();
  }

  search() {
    console.log('searching...');
  }

  focus() {
    console.log('focus');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
