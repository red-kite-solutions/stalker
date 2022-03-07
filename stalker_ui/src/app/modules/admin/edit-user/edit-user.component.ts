import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

interface Role {
  name: string;
  description: string;
  shortDescription: string;
}

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.scss']
})
export class EditUserComponent implements OnInit, OnDestroy {
  passwordConfirm: string = "";
  currentPassword: string = "";
  newUserValid: boolean = true;
  userId: number = -1;
  
  roles: Role[] = [
    { name: "admin", description: "Has full control over the application.", shortDescription: "Full control" }, 
    { name: "user", description: "Can only use the application, but cannot edit its configuration.", shortDescription: "Can use, but not configure" }, 
    { name: "read-only", description: "Has the read permissions of the user, but cannot edit anything but their own profile.", shortDescription: "Can read as a user, but not edit" }
  ];


  form = this.fb.group({
    firstName: ['', {
      validators: [
         Validators.required, 
      ],
      updateOn: 'blur'
    }],
    lastName: ['', {
      validators: [
         Validators.required, 
      ],
      updateOn: 'blur'
    }],
    email: ['', {
      validators: [
         Validators.required, 
         Validators.email
      ],
      updateOn: 'blur'
    }],
    newPassword: [
        '', 
        [(control: FormControl) : ValidationErrors | null => {
          if (control.value == '') {
            return null;
          }
          return control.value.length >= 12 ? null : 
              { "error" : "Password must be at least 12 characters long." }
        }],
    ],
    role: [
      '',
      [Validators.required]
    ],
    active: [true]
  });  

  hideCurrentPassword: boolean = true;
  hideUserPassword: boolean = true;
  private routeSub: Subscription | undefined;

  constructor(private fb: FormBuilder, public dialog: MatDialog, private route: ActivatedRoute) { }

  

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(params => {
      // TODO: Load data from backend
      this.userId = params['id'];
      this.form.controls["firstName"].setValue("John");
      this.form.controls["lastName"].setValue("Doe");
      this.form.controls["email"].setValue("john.doe@example.com");
      this.form.controls["role"].setValue(this.roles.find((role: Role) => role.name === "admin" ));
      this.form.controls["active"].setValue(true);

    });
  }

  onSubmit() {
    console.log("on submit");
    this.newUserValid = this.form.valid;
    if (!this.newUserValid) {
      this.form.markAllAsTouched();
    }
  }

  showUserRolesHelp() {
    let bulletPoints: string[] = Array<string>();
    this.roles.forEach((role: Role) => {
      bulletPoints.push(`${role.name} : ${role.description}`);
    });
    
    
    let data: ConfirmDialogData = {
      text: "Setting a user role is a crucial part of user creation. Their role will define what they can and cannot do in Stalker.",
      title: "User roles",
      positiveButtonText: "Got it",
      listElements:  bulletPoints,
      onPositiveButtonClick: () => {
        this.dialog.closeAll();
      }        
    }
    
    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false
    });
  }

  deleteUser() {
    let data: ConfirmDialogData = {
      text: "Do you really wish to delete this user permanently ?",
      title: "Deleting user",
      positiveButtonText: "Cancel",
      negativeButtonText: "Delete permanently",
      onPositiveButtonClick: () => {
        this.dialog.closeAll();
      },
      onNegativeButtonClick: () => {
        console.log(`Deleting user ${this.userId}`);
        this.dialog.closeAll();
      }
    }
     
    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
  }
}
