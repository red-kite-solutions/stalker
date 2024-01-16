import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, debounceTime, map, startWith, tap } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { CustomJobsService } from '../../../api/jobs/custom-jobs/custom-jobs.service';
import { SettingsService } from '../../../api/settings/settings.service';
import {
  CustomJob,
  CustomJobData,
  CustomJobFindingHandlerLanguage,
  CustomJobLanguage,
  CustomJobType,
  customJobTypes,
  customJobTypesLocalized,
  languageExtensionMapping,
  validCustomJobTypeDetails,
} from '../../../shared/types/jobs/custom-job.type';
import { JobPodSettings } from '../../../shared/types/settings/job-pod-settings.type';
import { CodeEditorComponent, CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';
import { FileTab } from '../../../shared/widget/code-editor/code-editor.type';
import { nucleiFindingHandlerTemplate } from './nuclei-finding-handler-template';

@Component({
  selector: 'app-custom-jobs',
  templateUrl: './custom-jobs.component.html',
  styleUrls: ['./custom-jobs.component.scss'],
})
export class CustomJobsComponent implements OnDestroy {
  public languageExtensionMapping = languageExtensionMapping;
  public readonly basePath = '/custom-jobs/';
  public readonly defaultUriFile = 'custom-job';
  public currentCodeBackup: string | undefined = '';
  public minimapEnabled = false;
  public theme: CodeEditorTheme = 'vs-dark';
  public readonly = false;
  public selectedConfigId = '';
  public customJobTypes = customJobTypes;
  public customJobTypesLocalized = customJobTypesLocalized;
  private readonly typeDefault: CustomJobType = 'code';
  public readonly languageDefault: CustomJobLanguage = 'python';
  private readonly findingHandlerLanguageDefault: CustomJobFindingHandlerLanguage = 'python';
  public currentLanguageOptions: CustomJobLanguage[] = this.getCurrentLanguageOptions(this.typeDefault);
  public findingHandlerLanguageOptions = this.getCurrentHandlerLanguageOptions(this.typeDefault);
  public handlerFormEnabled = false;
  private readonly handlerFileSuffix = '-handler';
  public readonly customJobCodeTabId = 'code';
  private readonly handlerCodeTabId = 'handler';

  @ViewChild(CodeEditorComponent) codeEditor!: CodeEditorComponent;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<CustomJobData>();

  public selectedRow: CustomJob | undefined;
  public tempSelectedRow: CustomJob | undefined;
  public isInNewCustomJobContext = true;
  private selectingCustomJobFlag1 = false;
  private selectingCustomJobFlag2 = false;
  public currentCustomJobId = '';
  public data = new Array<CustomJob>();
  public jobPodSettings$: Observable<JobPodSettings[]> = this.settingsService.getJobPodSettings();

  public dataSource$ = this.refreshData();

  public customJobForm = this.fb.group({
    customJobType: new FormControl<CustomJobType>(this.typeDefault),
    customJobName: new FormControl('', [Validators.required]),
    customJobLanguage: new FormControl<CustomJobLanguage>({ value: this.languageDefault, disabled: false }),
  });

  public findingHandlerForm = this.fb.group({
    findingHandlerEnabled: new FormControl<boolean>(false),
    findingHandlerLanguage: new FormControl<CustomJobFindingHandlerLanguage>({
      value: this.findingHandlerLanguageDefault,
      disabled: true,
    }),
  });

  private getCurrentLanguageOptions(type: string) {
    const tmpArr: CustomJobLanguage[] = [];

    for (const details of validCustomJobTypeDetails) {
      if (details.type === type) {
        tmpArr.push(details.language);
      }
    }
    return tmpArr;
  }

  private getCurrentHandlerLanguageOptions(type: string) {
    const tmpArr: CustomJobFindingHandlerLanguage[] = [];

    for (const details of validCustomJobTypeDetails) {
      if (details.type === type) {
        tmpArr.push(details.handlerLanguage);
      }
    }
    return tmpArr;
  }

  findingHandlerEnabled$ = this.findingHandlerForm.get('findingHandlerEnabled')?.valueChanges.pipe(
    startWith(false),
    tap((value) => {
      if (value) {
        this.findingHandlerForm.get('findingHandlerLanguage')?.enable();
      } else {
        this.findingHandlerForm.get('findingHandlerLanguage')?.disable();
      }
    })
  );

  findingHandlerLanguage$ = this.findingHandlerForm
    .get('findingHandlerLanguage')
    ?.valueChanges.pipe(startWith(undefined));

  findingHandlerFormSubscription$ = this.findingHandlerEnabled$?.subscribe();

  customJobName$ = this.customJobForm.get('customJobName')?.valueChanges.pipe(startWith(''));

  customJobType$ = this.customJobForm.get('customJobType')?.valueChanges.pipe(
    startWith(<CustomJobType>'code'),
    tap((currCustomJobType) => {
      if (currCustomJobType === null) return;
      this.currentLanguageOptions = this.getCurrentLanguageOptions(currCustomJobType);
      this.findingHandlerLanguageOptions = this.getCurrentHandlerLanguageOptions(currCustomJobType);
      this.handlerFormEnabled = this.typeIsHandlerEnabled(currCustomJobType);
      if (this.selectingCustomJobFlag1) {
        this.selectingCustomJobFlag1 = false;
        this.customJobForm
          .get('customJobLanguage')
          ?.setValue(this.selectedRow ? this.selectedRow.language : this.currentLanguageOptions[0]);
      } else {
        this.customJobForm.get('customJobLanguage')?.setValue(this.currentLanguageOptions[0]);
      }
    })
  );

  customJobLanguage$ = this.customJobForm.get('customJobLanguage')?.valueChanges.pipe(startWith(this.languageDefault));

  private handlerCodeFileTab$ = combineLatest([
    this.findingHandlerEnabled$!,
    this.customJobType$!,
    this.findingHandlerLanguage$!,
    this.customJobName$!,
  ]).pipe(
    debounceTime(200),
    map(([findingHandlerEnabled, customJobType, findingHandlerLanguage, customJobName]) => {
      const selecting = this.selectingCustomJobFlag2;
      if (this.selectingCustomJobFlag2) {
        this.selectingCustomJobFlag2 = false;
      }

      let handlerCode = selecting
        ? this.selectedRow?.findingHandler
        : this.codeEditor.getFileTabById(this.handlerCodeTabId)?.content;

      if (findingHandlerEnabled && !selecting && !handlerCode) {
        switch (this.customJobForm.get('customJobType')?.value) {
          case 'nuclei': {
            handlerCode = nucleiFindingHandlerTemplate;
            break;
          }
        }
      }

      let fileTab: FileTab | undefined = undefined;
      let fileName = customJobName ? customJobName : this.defaultUriFile;

      if (handlerCode && this.typeIsHandlerEnabled(customJobType)) {
        fileTab = {
          content: handlerCode,
          language: findingHandlerLanguage!,
          uri: `${this.basePath}${fileName}${this.handlerFileSuffix}.${
            languageExtensionMapping[findingHandlerLanguage!]
          }`,
          id: this.handlerCodeTabId,
        };
      }
      return fileTab;
    })
  );

  private customJobFormSubscription$ = combineLatest([
    this.customJobName$!,
    this.customJobType$!,
    this.customJobLanguage$!,
    this.handlerCodeFileTab$,
  ])
    .pipe(debounceTime(300))
    .subscribe(([customJobName, customJobType, customJobLanguage, handlerCodeFileTab]) => {
      let fileName = customJobName ? customJobName : this.defaultUriFile;

      const fileTabs: FileTab[] = [
        {
          content: this.codeEditor.getFileTabById(this.customJobCodeTabId)!.content,
          language: customJobLanguage!,
          uri: `${this.basePath}${fileName}.${languageExtensionMapping[customJobLanguage!]}`,
          id: this.customJobCodeTabId,
        },
      ];

      if (handlerCodeFileTab) fileTabs.push(handlerCodeFileTab);

      this.codeEditor.resetEditorFileTabs(fileTabs);
    });

  constructor(
    private dialog: MatDialog,
    private customJobsService: CustomJobsService,
    private toastr: ToastrService,
    private titleService: Title,
    private settingsService: SettingsService,
    private fb: FormBuilder
  ) {
    this.titleService.setTitle($localize`:Custom Jobs|:Custom Jobs`);
  }

  private typeIsHandlerEnabled(type: CustomJobType | undefined | null): boolean {
    return !!type && type === 'nuclei';
  }

  ngOnDestroy(): void {
    this.customJobFormSubscription$.unsubscribe();
    this.findingHandlerFormSubscription$?.unsubscribe();
  }

  private refreshData() {
    return this.customJobsService.getCustomJobs().pipe(
      map((data) => {
        this.data = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      })
    );
  }

  private validateCurrentChanges(next: Function) {
    if (this.codeEditor.getFileTabById(this.customJobCodeTabId)!.content === this.currentCodeBackup) {
      next();
      return;
    }

    const data: ConfirmDialogData = {
      text: $localize`:Unsaved job changes|Unsaved job changes:There are unsaved changes to the current custom job.`,
      title: $localize`:Unsaved Changes Detected|There are unsaved changes that the user may want to save:Unsaved Changes Detected`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Discard|Confirm that the user wants to leave despite losing changes:Discard`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: () => {
        next();
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  public newCustomJobClick() {
    this.validateCurrentChanges(this.newCustomJobNext.bind(this));
  }

  private newCustomJobNext() {
    this.isInNewCustomJobContext = true;
    this.selectedRow = undefined;
    this.codeEditor.setFileTabContentById(this.customJobCodeTabId, '');
    this.currentCodeBackup = '';
    this.selectedConfigId = '';
    this.customJobForm.get('customJobName')?.setValue('');
    this.customJobForm.get('customJobType')?.setValue('code');
  }

  public selectCustomJob(sub: CustomJob) {
    this.selectingCustomJobFlag1 = true;
    this.selectingCustomJobFlag2 = true;

    this.tempSelectedRow = sub;
    this.validateCurrentChanges(this.selectCustomJobNext.bind(this));
  }

  private selectCustomJobNext() {
    this.isInNewCustomJobContext = false;
    this.selectedRow = this.tempSelectedRow;
    const rowData = this.data.find((v) => v._id === this.tempSelectedRow?._id);
    if (!rowData) return;

    if (rowData._id) this.currentCustomJobId = rowData._id;

    this.codeEditor.setFileTabContentById(this.customJobCodeTabId, rowData.code ?? '');
    this.currentCodeBackup = rowData.code ?? '';
    this.selectedConfigId = rowData.jobPodConfigId ?? '';
    this.customJobForm.get('customJobName')?.setValue(rowData?.name ?? '');
    this.customJobForm.get('customJobType')?.setValue(rowData.type);
    this.findingHandlerForm.get('findingHandlerEnabled')?.setValue(rowData.findingHandlerEnabled ?? false);
  }

  public async saveCustomJobEdits() {
    if (!this.customJobForm.get('customJobName')?.valid || !this.customJobForm.get('customJobName')?.value) {
      this.customJobForm.get('customJobName')?.markAsTouched();
      this.toastr.error($localize`:Empty Name|A job name is required:Name job before submitting`);
      return;
    }

    if (!this.selectedConfigId) {
      this.toastr.error($localize`:Empty Config|Select a configuration before submitting:Missing pod configurations`);
      return;
    }

    const code = this.codeEditor.getFileTabById(this.customJobCodeTabId)!.content;
    if (!code) {
      this.toastr.error(
        $localize`:Empty Code|Write some code before submitting custom job:Write code before submitting`
      );
      return;
    }

    const type = this.customJobForm.get('customJobType')?.value;

    let handlerCode = this.codeEditor.getFileTabById(this.handlerCodeTabId)?.content;
    let handlerEnabled = this.findingHandlerForm.get('findingHandlerEnabled')?.value;
    let handlerLanguage = this.findingHandlerForm.get('findingHandlerLanguage')?.value;
    if (!this.typeIsHandlerEnabled(type)) {
      handlerEnabled = handlerEnabled ? false : handlerEnabled;
      handlerCode = handlerCode ? '' : handlerCode;
      handlerLanguage = handlerLanguage ? undefined : handlerLanguage;
    }

    const job: CustomJobData = {
      language: this.customJobForm.get('customJobLanguage')?.value ?? 'python',
      type: type ?? 'code',
      name: this.customJobForm.get('customJobName')?.value ?? '',
      code: code,
      jobPodConfigId: this.selectedConfigId,
      findingHandlerEnabled: handlerEnabled === null ? undefined : handlerEnabled,
      findingHandler: handlerCode,
      findingHandlerLanguage: handlerLanguage === null ? undefined : handlerLanguage,
    };

    const invalidCustomJob = $localize`:Invalid custom job|Custom job is not in a valid format:Invalid custom job`;

    let newCustomJob: undefined | CustomJob = undefined;
    try {
      if (this.isInNewCustomJobContext) {
        // create a new subscription
        newCustomJob = await this.customJobsService.create(job);
        this.toastr.success(
          $localize`:Successfully created custom job|Successfully created custom job:Successfully created custom job`
        );
      } else {
        // edit an existing subscription
        await this.customJobsService.edit(this.currentCustomJobId, job);
        this.toastr.success(
          $localize`:Successfully edited custom job|Successfully edited custom job:Successfully edited custom job`
        );
      }

      this.currentCodeBackup = this.codeEditor.getFileTabById(this.customJobCodeTabId)!.content;
      if (newCustomJob) {
        this.dataSource.data.push(newCustomJob);
        this.data.push(newCustomJob);
        this.selectCustomJob(newCustomJob);
      }

      this.dataSource$ = this.refreshData();
    } catch {
      this.toastr.error(invalidCustomJob);
    }
  }

  public async delete() {
    if (this.isInNewCustomJobContext) {
      this.toastr.warning(
        $localize`:Select a custom job to delete|The user needs to select a custom job to delete:Select a job to delete`
      );
      return;
    }

    const data: ConfirmDialogData = {
      text: $localize`:Confirm custom job deletion|Confirmation message asking if the user really wants to delete this custom job:Do you really wish to delete this custom job permanently ?`,
      title: $localize`:Deleting Custom Job|Title of a page to delete a custom job:Deleting custom job`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        try {
          await this.customJobsService.delete(this.currentCustomJobId);
          this.toastr.success(
            $localize`:Successfully deleted subscription|Successfully deleted subscription:Successfully deleted subscription`
          );
          this.dataSource$ = this.refreshData();
        } catch {
          this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
        }
        this.dialog.closeAll();
        this.newCustomJobNext();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
