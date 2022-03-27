import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/api/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  password = '';
  hide = true;
  loginValid = true;

  constructor(private authService: AuthService, private router: Router) {}

  async onSubmit() {
    const res = await this.authService.login(this.username, this.password);

    this.loginValid = res;
    if (res) {
      this.router.navigate(['/']);
    }
  }
}
