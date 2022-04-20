import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from 'src/app/api/users/users.service';
import { StatusString } from 'src/app/shared/types/status-string.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { Role, roles, rolesInfoDialogText } from '../roles';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
})
export class CreateUserComponent {
  newUserValid = true;
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
    password: ['', [Validators.minLength(12)]],
    role: ['', [Validators.required]],
    active: [true],
  });

  currentPasswordForm = this.fb.group({
    password: [],
  });

  hideCurrentPassword = true;
  hideUserPassword = true;

  constructor(
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private usersService: UsersService
  ) {}

  async onSubmit() {
    console.log('on submit');
    this.newUserValid = this.form.valid;
    if (!this.newUserValid) {
      this.form.markAllAsTouched();
      return;
    }

    const result: StatusString = await this.usersService.createUser(
      {
        email: this.form.controls['email'].value,
        firstName: this.form.controls['firstName'].value,
        lastName: this.form.controls['lastName'].value,
        role: this.form.controls['role'].value.name,
        active: this.form.controls['active'].value,
      },
      this.form.controls['password'].value,
      this.currentPasswordForm.controls['password'].value
    );

    this.invalidPassword = false;
    if (result === 'Success') {
      this.form.reset();
      this.form.controls['role'].setValue('');
      this.currentPasswordForm.reset();
      this.currentPasswordForm.controls['password'].setErrors(null);
      this.form.controls['active'].setValue(true);
      this.toastr.success('User created successfully');
    } else if (result === 'Invalid password') {
      this.invalidPassword = true;
      this.toastr.error('Invalid password');
    } else if (result === 'Already exists') {
      this.toastr.warning('User with this email already exists');
    } else {
      this.toastr.error('Error while creating user');
    }
  }

  showUserRolesHelp() {
    const bulletPoints: string[] = Array<string>();
    roles.forEach((role: Role) => {
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
}
