import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  
  passwordConfirm: string = "";
  currentPassword: string = "";
  profileEditValid: boolean = true;

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

  constructor(private fb: FormBuilder) { }

  

  ngOnInit(): void {
    this.form.controls["email"].setValue("john.doe@example.com");
    this.form.controls["firstName"].setValue("John");
    this.form.controls["lastName"].setValue("Doe");

  }

  onSubmit() {
    this.profileEditValid = this.form.valid;
  }

}
