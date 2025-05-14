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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { GroupsService } from '../../../api/groups/groups.service';
import { UsersService } from '../../../api/users/users.service';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { HasScopesDirective } from '../../../shared/directives/has-scopes.directive';
import { SharedModule } from '../../../shared/shared.module';
import { Group } from '../../../shared/types/group/group.type';
import { HttpStatus } from '../../../shared/types/http-status.type';
import { Page } from '../../../shared/types/page.type';
import { ExtendedUser, User } from '../../../shared/types/user.interface';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/widget/confirm-dialog/confirm-dialog.component';

@Component({
  standalone: true,
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss'],
  imports: [
    CommonModule,
    AppHeaderComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    FormsModule,
    SharedModule,
    MatSelectModule,
    MatFormFieldModule,
    MatOptionModule,
    MatDividerModule,
    MatInputModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatTableModule,
    HasScopesDirective,
  ],
})
export class EditUserComponent {
  passwordConfirm = '';
  newUserValid = true;
  userId = '';
  invalidPassword = false;

  allGroups$ = this.groupsService.getPage(0, 100).pipe(
    map((page: Page<Group>) => {
      return page.items;
    })
  );

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
        (control: UntypedFormControl): ValidationErrors | null => {
          if (control.value == '') {
            return null;
          }
          return control.value.length >= 12 ? null : { error: 'Password must be at least 12 characters long.' };
        },
      ],
    ],
    active: [true],
  });

  hideCurrentPassword = true;
  hideUserPassword = true;

  constructor(
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private usersService: UsersService,
    private groupsService: GroupsService,
    private toastr: ToastrService,
    private router: Router,
    private titleService: Title
  ) {}

  currentPasswordForm = this.fb.group({
    password: [],
  });

  private passwordErr = this.currentPasswordForm.get('password');
  public passwordErr$ = this.passwordErr?.statusChanges.pipe(
    map(() => {
      if (this.invalidPassword) {
        this.invalidPassword = false;
        return $localize`:Invalid password|The password provided by the user was invalid:Invalid password`;
      }
      return $localize`:Password needed|The user's password must be provided to create a new user:Your password must be provided to create a user`;
    })
  );

  public userEnabled$ = this.form.controls['active'].valueChanges.pipe(
    startWith(true),
    map((enabled) => {
      return enabled
        ? $localize`:User enabled|The user is enabled and therefore can login:User is enabled`
        : $localize`:User disabled|The user is disabled and therefore cannot login:User is disabled`;
    })
  );

  private conflictEmail = false;
  private emailErr = this.form.controls['email'];
  public emailErr$ = this.emailErr.statusChanges.pipe(
    map(() => {
      if (this.conflictEmail) {
        this.conflictEmail = false;
        return $localize`:Email unavailable|Conflict happenned when creating a user because another user already uses the provided email:User with this email already exists`;
      }
      return $localize`:Invalid email|Asking for the user to provide a valid email address:Please provide a valid email address`;
    })
  );

  private userId$ = this.route.params.pipe(
    map((params) => {
      this.userId = params['id'];
      return params['id'];
    })
  );

  public user$ = this.userId$.pipe(switchMap((id) => this.usersService.getUser(id))).pipe(
    tap((user) => this.setTitle(user.email)),
    shareReplay(1)
  );

  public userFullName$ = this.user$.pipe(map((x) => [x?.firstName, x?.lastName].filter((p) => p).join(' ')));

  public userWithGroups$ = this.user$.pipe(
    switchMap((user: User) => {
      return this.usersService.getUserGroups(user._id).pipe(
        map((groups: Group[]) => {
          return <ExtendedUser>{
            ...user,
            groups,
          };
        })
      );
    }),
    shareReplay(1)
  );

  public displayedColumns = ['name', 'description'];
  public groupsDataSource$ = this.userWithGroups$.pipe(map((user) => user.groups));

  public routeSub$ = this.userWithGroups$.pipe(
    map((user) => {
      this.form.controls['firstName'].setValue(user.firstName);
      this.form.controls['lastName'].setValue(user.lastName);
      this.form.controls['email'].setValue(user.email);
      this.form.controls['active'].setValue(user.active);
    })
  );

  async onSubmit() {
    this.newUserValid = this.form.valid && this.currentPasswordForm.valid;
    if (!this.newUserValid) {
      this.currentPasswordForm.markAllAsTouched();
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
      this.toastr.success(
        $localize`:User changed|Success message for when an admin successfully edits a user:User changed successfully`
      );
    } catch (err: any) {
      if (err.status === HttpStatus.Forbidden) {
        this.invalidPassword = true;
        this.currentPasswordForm.controls['password'].setErrors({ incorrect: true });
        this.toastr.error($localize`:Invalid password|The provided password was invalid:Invalid password`);
      }
      if (err.status === HttpStatus.Conflict) {
        this.conflictEmail = true;
        this.form.controls['email'].setErrors({ incorrect: true });
        this.toastr.warning(
          $localize`:Email unavailable|Conflict happenned when creating a user because another user already uses the provided email:User with this email already exists`
        );
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

  deleteUser() {
    const data: ConfirmDialogData = {
      text: $localize`:Confirm user deletion|Confirmation message asking if the user really wants to delete this other user:Do you really wish to delete this user permanently ?`,
      title: $localize`:Deleting user|Title of a page to delete a user:Deleting user`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        await this.usersService.deleteUser(this.userId);
        this.toastr.success(
          $localize`:User deleted|Confirm the successful deletion of a user:User deleted successfully`
        );
        this.router.navigate(['/admin/users']);
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  private setTitle(username: string) {
    this.titleService.setTitle($localize`:Edit user page title|:Users · ${username}`);
  }
}
