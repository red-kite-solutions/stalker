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
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, filter, map, tap, timer } from 'rxjs';
import { UsersService } from '../../../api/users/users.service';

@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-request-reset-password',
  templateUrl: './request-reset-password.component.html',
  styleUrls: ['./request-reset-password.component.scss'],
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
export class RequestResetPasswordComponent {
  public form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  public isSubmitting = signal(false);
  public retryCountdown$: Observable<number> | undefined;
  public invalidToken$ = this.route.queryParamMap.pipe(
    filter((x) => x.get('invalidToken') === 'true'),
    tap(() =>
      this.toastr.error(
        $localize`:Navigated with an invalid token.|:Seems like this token is expired! Please try again.`
      )
    )
  );

  constructor(
    private route: ActivatedRoute,
    private titleService: Title,
    private fb: FormBuilder,
    private usersService: UsersService,
    private toastr: ToastrService
  ) {
    this.titleService.setTitle($localize`:Forgot password|:Forgot password`);
  }

  public onSubmit = async () => {
    this.isSubmitting.set(true);
    this.form.markAllAsTouched();

    try {
      const { email } = this.form.value;
      if (!email) return;

      await this.usersService.requestResetPassword(email);

      const retryDelayMilliseconds = 60 * 1000;
      let retryAt = new Date(new Date().getTime() + retryDelayMilliseconds);

      this.retryCountdown$ = timer(0, 1000).pipe(
        map(() => (retryAt.getTime() - new Date().getTime()) / 1000),
        map((x) => Math.round(x)),
        map((x) => Math.max(x, 0))
      );
    } finally {
      this.isSubmitting.set(false);
    }
  };
}
