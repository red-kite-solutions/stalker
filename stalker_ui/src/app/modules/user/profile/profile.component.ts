import { Component } from '@angular/core';
import { FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { UsersService } from 'src/app/api/users/users.service';
import { HttpStatus } from 'src/app/shared/types/http-status.type';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  passwordConfirm = '';
  profileEditValid = true;
  invalidPassword = false;

  private validatePasswordEquals: Function = (control: FormControl): ValidationErrors | null => {
    if (control.root.get('newPassword')?.value === control.root.get('passwordConfirm')?.value) {
      control.root.get('passwordConfirm')?.setErrors(null);
      return null;
    } else {
      if (control.root.get('passwordConfirm') === control) {
        return {
          error: 'The password confirmation is not equal to the password',
        };
      } else {
        control.root.get('passwordConfirm')?.setErrors({
          error: 'The password confirmation is not equal to the password',
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

  form$ = this.usersService.getProfile().pipe(
    map((user) => {
      this.form.controls['email'].setValue(user.email);
      this.form.controls['firstName'].setValue(user.firstName);
      this.form.controls['lastName'].setValue(user.lastName);
      this.form.controls['email'].disable();
      return this.form;
    })
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
        return 'Invalid password';
      }
      return 'Your password must be provided to edit your profile';
    })
  );

  constructor(private fb: FormBuilder, private usersService: UsersService, private toastr: ToastrService) {}

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
      await this.usersService.editProfile(
        {
          firstName: this.form.controls['firstName'].value,
          lastName: this.form.controls['lastName'].value,
        },
        this.currentPasswordForm.controls['password'].value
      );
      this.toastr.success('Profile changed successfully');
    } catch (err: any) {
      if (err.status === HttpStatus.Forbidden) {
        this.invalidPassword = true;
        this.currentPasswordForm.controls['password'].setErrors({ incorrect: true });
        this.toastr.error('Invalid password');
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
      await this.usersService.changePassword(
        this.form.controls['newPassword'].value,
        this.currentPasswordForm.controls['password'].value
      );
      this.toastr.success('Password changed successfully');
    } catch (err: any) {
      if (err.status === HttpStatus.Forbidden) {
        this.invalidPassword = true;
        this.currentPasswordForm.controls['password'].setErrors({ incorrect: true });
        this.toastr.error('Invalid password');
      }
    }
  }
}
