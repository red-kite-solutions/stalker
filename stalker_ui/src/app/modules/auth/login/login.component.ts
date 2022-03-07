import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  username: string = "";
  password: string = "";
  hide: boolean = true;
  loginValid: boolean = true;
  constructor() { }

  ngOnInit(): void {
  }

  onSubmit() {

  }

}
