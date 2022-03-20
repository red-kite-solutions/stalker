import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/api/auth/auth.service';
import { UsersService } from 'src/app/api/users/users.service';
import { User } from 'src/app/shared/types/user.interface';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  
  passwordConfirm: string = "";
  currentPassword: string = "";
  profileEditValid: boolean = true;
  invalidPassword: boolean = false;

  private validatePasswordEquals: Function = (control: FormControl): ValidationErrors| null => {
    if (control.root.get('password')?.value === control.root.get('passwordConfirm')?.value) {
      control.root.get('passwordConfirm')?.setErrors(null);
      return null;
    } else {
      if (control.root.get('passwordConfirm') === control) {
        return { "error":"The password confirmation is not equal to the password" };
      } else {
        control.root.get('passwordConfirm')?.setErrors({ "error":"The password confirmation is not equal to the password" });
        return null;
      }
    }
  }



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
        [Validators.minLength(12), this.validatePasswordEquals],
    ],
    passwordConfirm: [
      '',
      [this.validatePasswordEquals]
    ]
  });  

  hideCurrentPassword: boolean = true;

  constructor(private fb: FormBuilder, private usersService: UsersService, private toastr: ToastrService) { }

  

  async ngOnInit(): Promise<void> {
    let user: User = await this.usersService.getProfile();

    this.form.controls["email"].setValue(user.email);
    this.form.controls["firstName"].setValue(user.firstName);
    this.form.controls["lastName"].setValue(user.lastName);
    this.form.controls["email"].disable();

  }

  async onSubmit() {
    this.profileEditValid = this.form.valid;
    if (!this.profileEditValid) {
      this.form.markAllAsTouched();
      return;
    }

    let result: string = await this.usersService.editProfile({
      // email: this.form.controls["email"].value,
      firstName: this.form.controls["firstName"].value,
      lastName: this.form.controls["lastName"].value
    }, this.currentPassword);

    if (result === "Success") {
      this.invalidPassword = false;
      this.toastr.success("Profile changed successfully");
    } else if (result === "Invalid password"){
      this.invalidPassword = true;
      this.toastr.error("Invalid password");
      return;
    } else {
      this.invalidPassword = false;
      this.toastr.error("Error while submitting changes");
    }

    if (this.form.controls["password"].value && 
        this.form.controls["password"].value === this.form.controls["passwordConfirm"].value) {
      let result: string = await this.usersService.changePassword(this.form.controls["password"].value, this.currentPassword);
      if (result === "Success") {
        this.invalidPassword = false;
        this.toastr.success("Password changed successfully");
      } else if (result === "Invalid password"){
        this.invalidPassword = true;
        this.toastr.error("Invalid password");
        return;
      } else {
        this.invalidPassword = false;
        this.toastr.error("Error while submitting new password");
      }
    }
  }

}
