import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { UsersService } from 'src/app/api/users/users.service';
import { StatusString } from 'src/app/shared/types/status-string.type';
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
export class EditUserComponent implements OnInit, OnDestroy {
  passwordConfirm = '';
  currentPassword = '';
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
  private routeSub: Subscription | undefined;

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(async (params) => {
      this.userId = params['id'];

      const user: User | null = await this.usersService.getUser(this.userId);
      if (user) {
        this.form.controls['firstName'].setValue(user.firstName);
        this.form.controls['lastName'].setValue(user.lastName);
        this.form.controls['email'].setValue(user.email);
        this.form.controls['role'].setValue(this.roles.find((role: Role) => role.name === user?.role));
        this.form.controls['active'].setValue(user.active);
      } else {
        this.toastr.error('Error loading user');
      }
    });
  }

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

    let res: StatusString = await this.usersService.editUser(this.userId, changes, this.currentPassword);

    if (res === 'Success') {
      this.invalidPassword = false;
      this.toastr.success('User changed successfully');
    } else if (res === 'Invalid password') {
      this.invalidPassword = true;
      this.toastr.error('Invalid password');
      return;
    } else {
      this.invalidPassword = false;
      this.toastr.error('Error while submitting changes');
    }

    if (this.form.controls['newPassword'].value != '') {
      res = await this.usersService.changeUserPassword(
        this.userId,
        this.form.controls['newPassword'].value,
        this.currentPassword
      );

      if (res === 'Success') {
        this.invalidPassword = false;
        this.toastr.success('Password changed successfully');
      } else if (res === 'Invalid password') {
        this.invalidPassword = true;
        this.toastr.error('Invalid password');
      } else {
        this.invalidPassword = false;
        this.toastr.error('Error while submitting new password');
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
      onPositiveButtonClick: () => {
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
      positiveButtonText: 'Cancel',
      negativeButtonText: 'Delete permanently',
      onPositiveButtonClick: () => {
        this.dialog.closeAll();
      },
      onNegativeButtonClick: async () => {
        console.log(`Deleting user ${this.userId}`);
        const res: string = await this.usersService.deleteUser(this.userId);
        if (res === 'Success') {
          this.toastr.success('User deleted successfully');
          this.router.navigate(['/admin/users']);
        } else {
          this.toastr.error(`Error deleting user`);
        }
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }
}
