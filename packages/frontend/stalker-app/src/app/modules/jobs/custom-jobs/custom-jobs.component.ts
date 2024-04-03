import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  distinctUntilChanged,
  firstValueFrom,
  map,
  of,
  pairwise,
  startWith,
} from 'rxjs';
import { ThemeService } from 'src/app/services/theme.service';
import { AppHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { PanelSectionModule } from 'src/app/shared/components/panel-section/panel-section.module';
import { HasUnsavedChanges } from 'src/app/shared/guards/unsaved-changes-can-deactivate.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FileTab } from 'src/app/shared/widget/code-editor/code-editor.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { SavingButtonComponent } from 'src/app/shared/widget/spinner-button/saving-button.component';
import { SpinnerButtonComponent } from 'src/app/shared/widget/spinner-button/spinner-button.component';
import { TextMenuComponent } from 'src/app/shared/widget/text-menu/text-menu.component';
import { CustomJobTemplatesService } from '../../../api/jobs/custom-job-templates/custom-job-templates.service';
import { CustomJobsService } from '../../../api/jobs/custom-jobs/custom-jobs.service';
import { SettingsService } from '../../../api/settings/settings.service';
import { CustomJobTemplate } from '../../../shared/types/jobs/custom-job-template.type';
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
import { CodeEditorComponent, CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';
import { nucleiFindingHandlerTemplate } from './nuclei-finding-handler-template';

@Component({
  standalone: true,
  selector: 'app-custom-jobs',
  templateUrl: './custom-jobs.component.html',
  styleUrls: ['./custom-jobs.component.scss'],
  imports: [
    AppHeaderComponent,
    CommonModule,
    CodeEditorComponent,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatOptionModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatOptionModule,
    MatIconModule,
    MatSidenavModule,
    MatTabsModule,
    MatTooltipModule,
    MatCardModule,
    SpinnerButtonComponent,
    TextMenuComponent,
    PanelSectionModule,
    MatDividerModule,
    MatCheckboxModule,
    SavingButtonComponent,
  ],
})
export class CustomJobsComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  public readonly basePath = '/custom-jobs/';
  public readonly defaultUriFile = 'custom-job';
  public readonly handlerFileSuffix = '-handler';
  public readonly customJobCodeTabId = 'code';
  public readonly handlerCodeTabId = 'handler';
  public readonly typeDefault: CustomJobType = 'code';
  public readonly languageDefault: CustomJobLanguage = 'python';
  public readonly findingHandlerLanguageDefault: CustomJobFindingHandlerLanguage = 'python';
  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );
  private id$ = this.activatedRoute.paramMap.pipe(map((x) => x.get('id')));

  public originalCode: string = '';
  public originalHandlerCode: string = '';
  public languageExtensionMapping = languageExtensionMapping;
  public customJobTypes = customJobTypes;
  public customJobTypesLocalized = customJobTypesLocalized;
  public languageOptions: CustomJobLanguage[] = [];
  public findingHandlerLanguageOptions: CustomJobFindingHandlerLanguage[] = [];

  @ViewChild(CodeEditorComponent) codeEditor!: CodeEditorComponent;

  public podSettingOptions$ = this.settingsService.getJobPodSettings();

  public handlerFormEnabled$ = of(false);
  public isSaving = false;
  public hasBeenSaved = false;
  public canSave = false;

  public customJobForm = this.fb.group({
    customJobType: this.fb.control<CustomJobType>(this.typeDefault),
    customJobName: this.fb.control<string>('', { validators: [Validators.required] }),
    customJobLanguage: this.fb.control<CustomJobLanguage>({ value: this.languageDefault, disabled: false }),
    podSettings: this.fb.control<string>(''),
    findingHandlerEnabled: this.fb.control<boolean>(false),
    findingHandlerLanguage: this.fb.control<CustomJobFindingHandlerLanguage>({
      value: this.findingHandlerLanguageDefault,
      disabled: true,
    }),
  });

  get customJobName() {
    return this.customJobForm.get('customJobName')?.value;
  }

  customJobLanguage$ = this.customJobForm.get('customJobLanguage')?.valueChanges.pipe(startWith(this.languageDefault));

  private valueChangeSubscription: Subscription | undefined = undefined;

  public hasUnsavedChanges$ = new BehaviorSubject(false);

  constructor(
    private dialog: MatDialog,
    private customJobsService: CustomJobsService,
    private toastr: ToastrService,
    private titleService: Title,
    private settingsService: SettingsService,
    private fb: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private themeService: ThemeService,
    private templateService: CustomJobTemplatesService
  ) {
    this.titleService.setTitle($localize`:Custom Jobs|:Custom Jobs`);
  }

  public async ngOnInit() {
    await this.initialize();
  }

  private async initialize() {
    const id = await firstValueFrom(this.id$);

    let customJob: CustomJob | undefined = undefined;
    if (id == null || id === 'create') {
      const templateId = this.activatedRoute.snapshot.queryParamMap.get('templateId');
      let template: CustomJobTemplate | undefined = undefined;
      if (templateId) {
        try {
          template = await firstValueFrom(this.templateService.get(templateId));
        } catch {
          template = undefined;
        }
      }

      const settingOptions = await firstValueFrom(this.podSettingOptions$);

      if (template) {
        customJob = {
          _id: undefined!,
          code: template.code,
          jobPodConfigId: template.jobPodConfigId ?? settingOptions[0]._id,
          language: template.language,
          name:
            $localize`:Template|Prefixing with Template when creating a new job from a template:Template` +
            `: ${template.name}`,
          type: template.type,
          findingHandler: template.findingHandler ?? undefined,
          findingHandlerEnabled: template.findingHandlerEnabled ?? undefined,
          findingHandlerLanguage: template.findingHandlerLanguage ?? undefined,
        };
      } else {
        customJob = {
          _id: undefined!,
          code: '',
          jobPodConfigId: settingOptions[0]._id,
          language: 'python',
          name: 'New job',
          type: 'code',
        };
      }
    } else {
      customJob = await firstValueFrom(this.customJobsService.get(id));
    }

    this.customJobForm.setValue({
      customJobLanguage: customJob.language,
      customJobName: customJob.name,
      customJobType: customJob.type,
      podSettings: customJob.jobPodConfigId,
      findingHandlerEnabled: customJob.findingHandlerEnabled || false,
      findingHandlerLanguage: customJob.findingHandlerLanguage || null,
    });

    const formValue$ = this.customJobForm.valueChanges.pipe(
      startWith(this.customJobForm.value),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );

    this.handlerFormEnabled$ = formValue$.pipe(map((x) => this.typeAllowsHandler(x.customJobType)));
    this.languageOptions = this.getLanguageOptions(customJob?.type || this.typeDefault);
    this.findingHandlerLanguageOptions = this.getHandlerLanguageOptions(customJob?.type || this.typeDefault);

    this.valueChangeSubscription?.unsubscribe();
    this.valueChangeSubscription = formValue$
      .pipe(startWith(undefined), pairwise())
      .subscribe(([oldFormValues, formValues]) => {
        if (formValues == null) return;

        if (oldFormValues != null) {
          this.canSave = true;
          this.hasUnsavedChanges$.next(true);
        }

        let { customJobName, customJobType, findingHandlerEnabled, customJobLanguage, findingHandlerLanguage } =
          formValues;

        this.languageOptions = this.getLanguageOptions(customJobType || this.typeDefault);
        this.findingHandlerLanguageOptions = this.getHandlerLanguageOptions(customJobType || this.typeDefault);

        if (!this.languageOptions.includes(customJobLanguage as CustomJobLanguage)) {
          customJobLanguage = this.languageOptions[0];
          this.customJobForm.controls.customJobLanguage.setValue(customJobLanguage);
        }

        findingHandlerEnabled
          ? this.customJobForm.controls.findingHandlerLanguage.enable()
          : this.customJobForm.controls.findingHandlerLanguage.disable();

        const hasNameChanged = oldFormValues?.customJobName != formValues.customJobName;
        const hasTypeChanged = oldFormValues?.customJobType != formValues.customJobType;
        const hasHandlerStatusChanged = oldFormValues?.findingHandlerEnabled != formValues.findingHandlerEnabled;

        if (hasNameChanged || hasTypeChanged || hasHandlerStatusChanged) {
          this.initializeFileTabs(
            {
              name: customJobName!,
              language: customJobLanguage!,
              handlerEnabled: (this.typeAllowsHandler(customJobType) && findingHandlerEnabled) || false,
              handlerLanguage: findingHandlerLanguage,
            },
            hasHandlerStatusChanged
          );
        }
      });

    this.originalCode = customJob?.code ?? '';
    this.originalHandlerCode = customJob?.findingHandler ?? '';
    this.initializeFileTabs({
      language: customJob?.language!,
      name: customJob?.name!,
      handlerEnabled: this.typeAllowsHandler(customJob?.type) && customJob?.findingHandlerEnabled!,
      handlerLanguage: customJob?.findingHandlerLanguage,
    });
  }

  private initializeFileTabs(
    customJob: {
      name: string;
      language: CustomJobLanguage;
      handlerEnabled?: boolean;
      handlerLanguage?: CustomJobFindingHandlerLanguage | null;
    },
    hasHandlerStatusChanged = false
  ) {
    const { name, language, handlerEnabled, handlerLanguage } = customJob;

    const currentCode = this.codeEditor.getFileTabById(this.customJobCodeTabId)?.content ?? '';
    if (currentCode != null && currentCode != '') {
      this.originalCode = currentCode;
    }

    const currentHandlerCode = this.codeEditor.getFileTabById(this.handlerCodeTabId)?.content ?? '';
    if (currentHandlerCode != null && currentHandlerCode != '') {
      this.originalHandlerCode = currentHandlerCode;
    }

    let fileName = name ?? this.defaultUriFile;
    const fileTabs: FileTab[] = [this.getFileTab(this.customJobCodeTabId, fileName, language, this.originalCode)];

    if (handlerEnabled) {
      const handlerCode =
        hasHandlerStatusChanged && !this.originalHandlerCode ? nucleiFindingHandlerTemplate : this.originalHandlerCode;
      fileTabs.push(
        this.getFileTab(this.handlerCodeTabId, `${fileName}_handler`, handlerLanguage ?? 'python', handlerCode)
      );
    }

    this.codeEditor.resetEditorFileTabs(fileTabs);
  }

  private getFileTab(
    id: string,
    fileName: string,
    language: CustomJobLanguage | CustomJobFindingHandlerLanguage | undefined,
    code: string | undefined
  ) {
    return {
      content: code || '',
      language: language!,
      uri: `${this.basePath}${fileName}.${languageExtensionMapping[language!]}`,
      id,
    };
  }

  private getLanguageOptions(type: string): CustomJobLanguage[] {
    return validCustomJobTypeDetails.filter((x) => x.type === type).map((x) => x.language);
  }

  private getHandlerLanguageOptions(type: string): CustomJobFindingHandlerLanguage[] {
    return validCustomJobTypeDetails.filter((x) => x.type === type).map((x) => x.handlerLanguage);
  }

  private typeAllowsHandler(type: CustomJobType | undefined | null): boolean {
    return !!type && type === 'nuclei';
  }

  ngOnDestroy(): void {
    this.valueChangeSubscription?.unsubscribe();
  }

  public async forceSave() {
    this.canSave = true;
    await this.save();
  }

  public async save() {
    if (!this.customJobForm.get('customJobName')?.valid || !this.customJobForm.get('customJobName')?.value) {
      this.customJobForm.get('customJobName')?.markAsTouched();
      this.toastr.error($localize`:Empty Name|A job name is required:Name job before submitting`);
      return;
    }

    if (!this.customJobForm.value.podSettings) {
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

    const {
      customJobLanguage,
      customJobName,
      customJobType,
      findingHandlerEnabled,
      findingHandlerLanguage,
      podSettings,
    } = this.customJobForm.value;

    const job: CustomJobData = {
      language: customJobLanguage ?? 'python',
      type: customJobType ?? 'code',
      name: customJobName ?? '',
      code: code,
      jobPodConfigId: podSettings,
      findingHandler: undefined,
      findingHandlerLanguage: undefined,
      findingHandlerEnabled: undefined,
    };

    if (this.typeAllowsHandler(customJobType)) {
      job.findingHandler = this.codeEditor.getFileTabById(this.handlerCodeTabId)?.content;
      job.findingHandlerLanguage = findingHandlerLanguage === null ? undefined : findingHandlerLanguage;
      job.findingHandlerEnabled = findingHandlerEnabled || false;
    }

    const id = await firstValueFrom(this.id$);
    try {
      this.isSaving = true;
      if (id == null || id === 'create') {
        // Create a new subscription
        const newCustomJob = await this.customJobsService.create(job);
        this.toastr.success(
          $localize`:Successfully created custom job|Successfully created custom job:Successfully created custom job`
        );

        this.router.navigate(['/', 'jobs', 'custom', newCustomJob._id]);
      } else {
        // Edit an existing subscription
        await this.customJobsService.edit(id, job);
        this.toastr.success(
          $localize`:Successfully edited custom job|Successfully edited custom job:Successfully edited custom job`
        );
      }

      this.hasBeenSaved = true;
      this.canSave = false;
      this.hasUnsavedChanges$.next(false);
    } catch (e) {
      this.toastr.error($localize`:Invalid custom job|Custom job is not in a valid format:Invalid custom job`);
    } finally {
      this.isSaving = false;
    }
  }

  public async delete() {
    const id = await firstValueFrom(this.id$);
    if (id == null) throw new Error('Missing id.');

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
          await this.customJobsService.delete(id);
          this.toastr.success(
            $localize`:Successfully deleted subscription|Successfully deleted subscription:Successfully deleted subscription`
          );

          await this.router.navigate(['/jobs', 'custom']);
        } catch {
          this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
        }
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
