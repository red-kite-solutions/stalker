import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { map, switchMap } from 'rxjs';
import { UsersService } from 'src/app/api/users/users.service';
import { HttpStatus } from 'src/app/shared/types/http-status.type';
import { User } from 'src/app/shared/types/user.interface';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { Role, roles, rolesInfoDialogText } from '../roles';

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
})
export class EditUserComponent implements OnDestroy {
  passwordConfirm = '';
  newUserValid = true;
  userId = '';
  invalidPassword = false;

  roles = roles;

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
    newPassword: [
      '',
      [
        (control: FormControl): ValidationErrors | null => {
          if (control.value == '') {
            return null;
          }
          return control.value.length >= 12 ? null : { error: 'Password must be at least 12 characters long.' };
        },
      ],
    ],
    role: ['', [Validators.required]],
    active: [true],
  });

  hideCurrentPassword = true;
  hideUserPassword = true;

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private toastr: ToastrService,
    private router: Router
  ) {}

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
      return 'Your password must be provided to edit a user';
    })
  );

  private conflictEmail = false;
  private emailErr = this.form.controls['email'];
  public emailErr$ = this.emailErr.statusChanges.pipe(
    map(() => {
      if (this.conflictEmail) {
        this.conflictEmail = false;
        return 'User with this email already exists';
      }
      return 'Please provide a valid email address';
    })
  );

  private routeSub$ = this.route.params
    .pipe(
      switchMap((params) => {
        this.userId = params['id'];
        return this.usersService.getUser(this.userId);
      })
    )
    .subscribe((user: any) => {
      this.form.controls['firstName'].setValue(user.firstName);
      this.form.controls['lastName'].setValue(user.lastName);
      this.form.controls['email'].setValue(user.email);
      this.form.controls['role'].setValue(this.roles.find((role: Role) => role.name === user?.role));
      this.form.controls['active'].setValue(user.active);
    });

  async onSubmit() {
    this.newUserValid = this.form.valid;
    if (!this.newUserValid) {
      this.form.markAllAsTouched();
      return;
    }

    const changes: Partial<User> = {
      firstName: this.form.controls['firstName'].value,
      lastName: this.form.controls['lastName'].value,
      email: this.form.controls['email'].value,
      active: this.form.controls['active'].value,
    };

    this.currentPasswordForm.controls['password'].setErrors(null);
    this.form.controls['email'].setErrors(null);
    this.invalidPassword = false;
    this.conflictEmail = false;

    try {
      await this.usersService.editUser(this.userId, changes, this.currentPasswordForm.get('password')?.value);
      this.toastr.success('User changed successfully');
    } catch (err: any) {
      if (err.status === HttpStatus.Forbidden) {
        this.invalidPassword = true;
        this.currentPasswordForm.controls['password'].setErrors({ incorrect: true });
        this.toastr.error('Invalid password');
      }
      if (err.status === HttpStatus.Conflict) {
        this.conflictEmail = true;
        this.form.controls['email'].setErrors({ incorrect: true });
        this.toastr.warning('User with this email already exists');
      }
    }

    if (
      this.form.controls['newPassword'].value == '' ||
      this.currentPasswordForm.controls['password'].errors ||
      this.form.controls['email'].errors
    ) {
      return;
    }

    try {
      await this.usersService.changeUserPassword(
        this.userId,
        this.form.controls['newPassword'].value,
        this.currentPasswordForm.get('password')?.value
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

  showUserRolesHelp() {
    const bulletPoints: string[] = Array<string>();
    this.roles.forEach((role: Role) => {
      bulletPoints.push(`${role.name} : ${role.description}`);
    });

    const data: ConfirmDialogData = {
      ...rolesInfoDialogText,
      listElements: bulletPoints,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  deleteUser() {
    const data: ConfirmDialogData = {
      text: 'Do you really wish to delete this user permanently ?',
      title: 'Deleting user',
      primaryButtonText: 'Cancel',
      dangerButtonText: 'Delete permanently',
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        await this.usersService.deleteUser(this.userId);
        this.toastr.success('User deleted successfully');
        this.router.navigate(['/admin/users']);
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  ngOnDestroy() {
    this.routeSub$?.unsubscribe();
  }
}
