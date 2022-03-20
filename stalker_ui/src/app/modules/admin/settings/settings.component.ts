import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SettingsService } from 'src/app/api/settings/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  PASSWORD_PLACEHOLDER: string = '********';

  keybaseEnabled: boolean = false;
  reportingEnabled: boolean = false;

  keybaseReportingForm = this.fb.group({
    username: [
      '',
      {
        validators: [Validators.required],
        updateOn: 'blur',
      },
    ],
    paperkey: [
      '',
      {
        validators: [Validators.required],
        updateOn: 'blur',
      },
    ],
    conversationId: [
      '',
      {
        validators: [Validators.required],
        updateOn: 'blur',
      },
    ],
  });

  hidePaperkey: boolean = true;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private settingsService: SettingsService
  ) {}

  async ngOnInit(): Promise<void> {
    let settings: any = await this.settingsService.getSettings();

    this.reportingEnabled = settings.isNewContentReported;
    this.keybaseEnabled = settings.keybaseConfig.enabled;
    this.keybaseReportingForm.controls['username'].setValue(
      settings.keybaseConfig.username ? settings.keybaseConfig.username : ''
    );
    this.keybaseReportingForm.controls['paperkey'].setValue(
      settings.keybaseConfig.paperkey ? settings.keybaseConfig.paperkey : ''
    );
    this.keybaseReportingForm.controls['conversationId'].setValue(
      settings.keybaseConfig.channelId ? settings.keybaseConfig.channelId : ''
    );

    this.keybaseEnabled && this.reportingEnabled
      ? this.keybaseReportingForm.enable()
      : this.keybaseReportingForm.disable();
  }

  syncKeybase() {
    this.toastr.success('Connection successful');
  }

  toggleKeybaseForm(event: boolean = true) {
    this.keybaseEnabled && this.reportingEnabled
      ? this.keybaseReportingForm.enable()
      : this.keybaseReportingForm.disable();
  }

  async saveSettings() {
    let res: string;
    if (
      this.keybaseReportingForm.controls['paperkey'].value !==
      this.PASSWORD_PLACEHOLDER
    ) {
      res = await this.settingsService.submitSettings({
        isNewContentReported: this.reportingEnabled,
        keybaseConfigEnabled: this.keybaseEnabled,
        keybaseConfigUsername:
          this.keybaseReportingForm.controls['username'].value,
        keybaseConfigPaperkey:
          this.keybaseReportingForm.controls['paperkey'].value,
        keybaseConfigChannelId:
          this.keybaseReportingForm.controls['conversationId'].value,
      });
    } else {
      res = await this.settingsService.submitSettings({
        isNewContentReported: this.reportingEnabled,
        keybaseConfigEnabled: this.keybaseEnabled,
        keybaseConfigUsername:
          this.keybaseReportingForm.controls['username'].value,
        keybaseConfigChannelId:
          this.keybaseReportingForm.controls['conversationId'].value,
      });
    }

    if (res === 'Success') {
      this.toastr.success('Settings saved successfully');
    } else {
      this.toastr.error('Error saving settings');
    }
  }

  toggleReporting(value: boolean) {
    this.toggleKeybaseForm();
  }
}
