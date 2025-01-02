import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class LoginComponent {
  isSubmitting = signal(false);
  hide = true;
  loginSuccess: boolean | undefined = undefined;

  loginSuccessValidator = (): ValidationErrors | null =>
    this.loginSuccess === false ? { invalidCredentials: true } : {};

  public form = this.fb.group({
    email: this.fb.control('', Validators.compose([Validators.email, Validators.required])),
    password: this.fb.control('', Validators.compose([this.loginSuccessValidator, Validators.required])),
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private titleService: Title,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.titleService.setTitle($localize`:Sign in page title|:Sign in to Red Kite`);
    this.authService.checkServerSetup(true);
  }

  public onSubmit = async () => {
    this.isSubmitting.set(true);
    try {
      this.form.markAllAsTouched();

      const { email, password } = this.form.value;
      this.loginSuccess = await this.authService.login(email!, password!);
      this.form.controls.password.updateValueAndValidity();
      this.cdr.detectChanges();
      if (!this.loginSuccess) {
        return;
      }

      const encodedUrl = await firstValueFrom(this.route.queryParamMap.pipe(map((x) => x.get('returnUrl'))));
      const returnUrl = encodedUrl != null ? decodeURI(encodedUrl) : null;
      await this.router.navigateByUrl(returnUrl ?? '/');
    } finally {
      this.isSubmitting.set(false);
    }
  };
}
