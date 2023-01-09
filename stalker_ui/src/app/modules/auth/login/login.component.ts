import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Sign in page title|:Sign in to Stalker`);
  }

  async onSubmit() {
    const res = await this.authService.login(this.username, this.password);

    this.loginValid = res;
    if (res) {
      const encodedUrl = await firstValueFrom(this.route.queryParamMap.pipe(map((x) => x.get('returnUrl'))));
      const returnUrl = encodedUrl != null ? decodeURI(encodedUrl) : null;
      this.router.navigateByUrl(returnUrl ?? '/');
    }
  }
}
