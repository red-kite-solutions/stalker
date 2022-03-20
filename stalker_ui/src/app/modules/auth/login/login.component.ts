import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/api/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = "";
  password: string = "";
  hide: boolean = true;
  loginValid: boolean = true;
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
  }

  async onSubmit() {

    let res = await this.authService.login(this.username, this.password);

    this.loginValid = res;
    if (res) {
      this.router.navigate(['/']);
    }
  }

}
