import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/api/auth/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Output()
  toggleSideBarEvent: EventEmitter<any> = new EventEmitter();

  public email = '';

  constructor(private authService: AuthService, private router: Router) {
    this.email = this.authService.email;
  }

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
