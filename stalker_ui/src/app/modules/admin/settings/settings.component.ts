import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  keybaseEnabled: boolean = false;

  keybaseReportingForm = this.fb.group({
    username: ['', {
      validators: [
         Validators.required, 
      ],
      updateOn: 'blur'
    }],
    paperkey: ['', {
      validators: [
         Validators.required, 
      ],
      updateOn: 'blur'
    }],
    conversationId: ['', {
      validators: [
         Validators.required,
      ],
      updateOn: 'blur'
    }]    
  });  

  hidePaperkey: boolean = true;

  constructor(private fb: FormBuilder, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.keybaseEnabled ? this.keybaseReportingForm.enable() : this.keybaseReportingForm.disable();
  }

  syncKeybase() {
    this.toastr.success("Connection successful");
  }

  toggleKeybaseForm(value: boolean) {
    this.keybaseEnabled ? this.keybaseReportingForm.enable() : this.keybaseReportingForm.disable();
  }

  saveSettings() {
    this.toastr.success("Settings saved successfully");
  }

}
