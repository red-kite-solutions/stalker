import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { map, of, shareReplay, switchMap, tap } from 'rxjs';
import { AuthService } from 'src/app/api/auth/auth.service';
import { UsersService } from 'src/app/api/users/users.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
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
export class ResetPasswordComponent {
  public form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(12)]],
  });

  public isSubmitting = signal(false);
  public canResetPassword$ = this.route.queryParamMap.pipe(
    map((x) => x.get('token')),
    switchMap((x) => {
      if (!x) return of(false);
      return this.authService.loginUsingToken(x);
    }),
    tap((isAuthorized) => {
      if (!isAuthorized) this.router.navigate(['/auth', 'request-reset'], { queryParams: { invalidToken: true } });
    }),
    shareReplay(1)
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.titleService.setTitle($localize`:Reset password|:Reset password`);
  }

  public onSubmit = async () => {
    this.form.markAllAsTouched();
    if (!this.form.valid) return;

    try {
      this.isSubmitting.set(true);
      const { password } = this.form.value;
      if (!password) return;

      await this.usersService.changeUserPassword(this.authService.id, password, undefined);
      this.toastr.success($localize`:Password updated with success.:Password updated successfully!`);
      await this.router.navigate(['/auth', 'login']);
    } finally {
      this.isSubmitting.set(false);
    }
  };
}
