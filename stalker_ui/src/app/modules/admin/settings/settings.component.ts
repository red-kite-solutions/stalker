import { Component } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { SettingsService } from 'src/app/api/settings/settings.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  keybaseEnabled = false;
  reportingEnabled = false;
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

  public settings$ = this.settingsService.getSettings().pipe(
    map((settings) => {
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
      return settings;
    })
  );

  hidePaperkey = true;

  constructor(private fb: UntypedFormBuilder, private toastr: ToastrService, private settingsService: SettingsService) {}

  syncKeybase() {
    this.toastr.error('Sorry, not implemented yet');
  }

  toggleKeybaseForm() {
    this.keybaseEnabled && this.reportingEnabled
      ? this.keybaseReportingForm.enable()
      : this.keybaseReportingForm.disable();
  }

  async saveSettings() {
    await this.settingsService.submitSettings({
      isNewContentReported: this.reportingEnabled,
      keybaseConfigEnabled: this.keybaseEnabled,
      keybaseConfigUsername: this.keybaseReportingForm.controls['username'].value,
      keybaseConfigPaperkey: this.keybaseReportingForm.controls['paperkey'].value,
      keybaseConfigChannelId: this.keybaseReportingForm.controls['conversationId'].value,
    });
    this.toastr.success(
      $localize`:Settings saved|Confirmation message saying that the settings were properly saved:Settings saved successfully`
    );
  }

  toggleReporting() {
    this.toggleKeybaseForm();
  }
}
