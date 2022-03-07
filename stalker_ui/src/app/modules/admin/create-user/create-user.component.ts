import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

interface Role {
  name: string;
  description: string;
  shortDescription: string;
}

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {

  passwordConfirm: string = "";
  currentPassword: string = "";
  newUserValid: boolean = true;
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
    password: [
        '', 
        [Validators.minLength(12)],
    ],
    role: [
      '',
      [Validators.required]
    ],
    active: [true]
  });  

  hideCurrentPassword: boolean = true;
  hideUserPassword: boolean = true;

  constructor(private fb: FormBuilder, public dialog: MatDialog) { }

  

  ngOnInit(): void {
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

}
