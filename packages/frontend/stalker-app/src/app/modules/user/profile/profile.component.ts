import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map, shareReplay } from 'rxjs';
import { AuthService } from '../../../api/auth/auth.service';
import { UsersService } from '../../../api/users/users.service';
import { HttpStatus } from '../../../shared/types/http-status.type';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ApiKeyComponent } from '../api-key/api-key.component';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    FormsModule,
    AppHeaderComponent,
    MatTooltipModule,
    MatDividerModule,
    ReactiveFormsModule,
    ApiKeyComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  passwordConfirm = '';
  profileEditValid = true;
  invalidPassword = false;
  profileBreadCrumbs = $localize`:Profile|Profile:Profile`;

  private validatePasswordEquals: Function = (control: UntypedFormControl): ValidationErrors | null => {
    if (control.root.get('newPassword')?.value === control.root.get('passwordConfirm')?.value) {
      control.root.get('passwordConfirm')?.setErrors(null);
      return null;
    } else {
      if (control.root.get('passwordConfirm') === control) {
        return {
          error: $localize`:Password confirm not equal|The password confirmation is not equal to the new password so the form is invalid:The password confirmation is not equal to the password`,
        };
      } else {
        control.root.get('passwordConfirm')?.setErrors({
          error: $localize`:Password confirm not equal|The password confirmation is not equal to the new password so the form is invalid:The password confirmation is not equal to the password`,
        });
        return null;
      }
    }
  };

  form = this.fb.group({
    firstName: [
      '',
      {
        validators: [Validators.required],
        updateOn: 'blur',
      },
    ],
    lastName: [
      '',
      {
        validators: [Validators.required],
        updateOn: 'blur',
      },
    ],
    email: [
      '',
      {
        validators: [Validators.required, Validators.email],
        updateOn: 'blur',
      },
    ],
    newPassword: ['', [Validators.minLength(12), this.validatePasswordEquals]],
    passwordConfirm: ['', [this.validatePasswordEquals]],
  });

  userId: string | undefined = undefined;
  form$ = this.usersService.getUser(this.authService.id).pipe(
    map((user: any) => {
      this.form.controls['email'].setValue(user.email);
      this.form.controls['firstName'].setValue(user.firstName);
      this.form.controls['lastName'].setValue(user.lastName);
      this.form.controls['email'].disable();
      this.userId = user._id;
      return this.form;
    }),
    shareReplay(1)
  );

  hideCurrentPassword = true;
  currentPasswordForm = this.fb.group({
    password: [],
  });

  private passwordErr = this.currentPasswordForm.get('password');
  public passwordErr$ = this.passwordErr?.statusChanges.pipe(
    map(() => {
      if (this.invalidPassword) {
        this.invalidPassword = false;
        return $localize`:Invalid password|The provided password was invalid:Invalid password`;
      }
      return $localize`:Password required|Password is required by the user to confirm their identity to edit their profile:Your password must be provided to edit your profile`;
    })
  );

  constructor(
    private fb: UntypedFormBuilder,
    private usersService: UsersService,
    private toastr: ToastrService,
    private authService: AuthService,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Logged in user profile page title|:Profile`);
  }

  async onSubmit() {
    this.profileEditValid = this.form.valid && this.currentPasswordForm.valid;
    if (!this.profileEditValid) {
      this.currentPasswordForm.markAllAsTouched();
      this.form.markAllAsTouched();
      return;
    }

    this.invalidPassword = false;
    this.currentPasswordForm.controls['password'].setErrors(null);

    try {
      await this.usersService.editUser(
        this.authService.id,
        {
          firstName: this.form.controls['firstName'].value,
          lastName: this.form.controls['lastName'].value,
        },
        this.currentPasswordForm.controls['password'].value
      );
      this.toastr.success(
        $localize`:Profile changed|User successfully edited their profile:Profile changed successfully`
      );
    } catch (err: any) {
      if (err.status === HttpStatus.Forbidden) {
        this.invalidPassword = true;
        this.currentPasswordForm.controls['password'].setErrors({ incorrect: true });
        this.toastr.error($localize`:Invalid password|The provided password was invalid:Invalid password`);
      }
    }

    if (
      !this.form.controls['newPassword'].value ||
      this.form.controls['newPassword'].value !== this.form.controls['passwordConfirm'].value ||
      this.currentPasswordForm.controls['password'].errors
    ) {
      return;
    }
    try {
      await this.usersService.changeUserPassword(
        this.authService.id,
        this.form.controls['newPassword'].value,
        this.currentPasswordForm.controls['password'].value
      );
      this.toastr.success(
        $localize`:Password changed|Confirm the successful password change:Password changed successfully`
      );
    } catch (err: any) {
      if (err.status === HttpStatus.Forbidden) {
        this.invalidPassword = true;
        this.currentPasswordForm.controls['password'].setErrors({ incorrect: true });
        this.toastr.error($localize`:Invalid password|The provided password was invalid:Invalid password`);
      }
    }
  }
}
