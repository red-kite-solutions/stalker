import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, ValidationErrors, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../api/auth/auth.service';
import { UsersService } from '../../../api/users/users.service';

@Component({
  selector: 'app-first',
  templateUrl: './first-user.component.html',
  styleUrls: ['./first-user.component.scss'],
})
export class FirstUserComponent {
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
      },
    ],
    lastName: [
      '',
      {
        validators: [Validators.required],
      },
    ],
    email: [
      '',
      {
        validators: [Validators.required, Validators.email],
      },
    ],
    newPassword: ['', [Validators.minLength(12), this.validatePasswordEquals, Validators.required]],
    passwordConfirm: ['', [this.validatePasswordEquals, Validators.required]],
  });

  hide = true;
  hideConfirm = true;
  loginValid = true;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private titleService: Title,
    private toastr: ToastrService,
    private usersService: UsersService,
    private authService: AuthService
  ) {
    this.titleService.setTitle($localize`:Initial setup|Create first user page title:Initial Setup`);
    this.authService.checkServerSetup();
  }

  async onSubmit() {
    const email: string = this.form.get('email')?.value;
    const firstName: string = this.form.get('firstName')?.value;
    const lastName: string = this.form.get('lastName')?.value;
    const password: string = this.form.get('newPassword')?.value;
    const confirmPassword: string = this.form.get('passwordConfirm')?.value;

    for (const key of Object.keys(this.form.controls)) {
      this.form.controls[key.toString()].updateValueAndValidity();
    }

    if (!(email && firstName && lastName && password && confirmPassword) || this.form.invalid) {
      this.toastr.error(
        $localize`:The form contains errors|The user must finish filling the form before submitting:The form contains errors`
      );
      return;
    }

    try {
      await this.usersService.createFirstUser(email, password, firstName, lastName);
      this.toastr.success(
        $localize`:Red Kite initialized|The platform is properly intialized:Red Kite is now initialized`
      );
      this.router.navigateByUrl('/auth/login');
    } catch {
      this.toastr.error(
        $localize`:Error submitting the form|There was an error while submitting the form content:Error submitting the form`
      );
      return;
    }
  }
}
