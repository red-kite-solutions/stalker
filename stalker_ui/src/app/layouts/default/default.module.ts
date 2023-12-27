import { MAT_COLOR_FORMATS, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RouterModule } from '@angular/router';
import { NgxFileDropModule } from 'ngx-file-drop';
import { CreateUserComponent } from 'src/app/modules/admin/create-user/create-user.component';
import { EditUserComponent } from 'src/app/modules/admin/edit-user/edit-user.component';
import { SettingsComponent } from 'src/app/modules/admin/settings/settings.component';
import { EditCompaniesComponent } from 'src/app/modules/companies/edit-companies/edit-companies.component';
import { JobLogsSummaryComponent } from 'src/app/modules/jobs/job-executions/job-execution-logs-summary.component';
import { SubscriptionComponent } from 'src/app/modules/jobs/subscriptions/subscription.component';
import { ProfileComponent } from 'src/app/modules/user/profile/profile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FindingsModule } from '../../modules/findings/findings.module';
import { CustomJobsComponent } from '../../modules/jobs/custom-jobs/custom-jobs.component';
import { JobExecutionDetailComponent } from '../../modules/jobs/job-executions/job-execution-detail.component';
import { LaunchJobsComponent } from '../../modules/jobs/launch-jobs/launch-jobs.component';
import { JobLogsComponent } from '../../shared/components/job-logs/job-logs.component';
import { AppHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../shared/components/panel-section/panel-section.module';
import { CodeEditorComponent } from '../../shared/widget/code-editor/code-editor.component';
import { DefaultComponent } from './default.component';

@NgModule({
  declarations: [
    DefaultComponent,
    ProfileComponent,
    CreateUserComponent,
    EditUserComponent,
    SettingsComponent,
    EditCompaniesComponent,
    SubscriptionComponent,
    CustomJobsComponent,
    LaunchJobsComponent,
    JobExecutionDetailComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    MatSidenavModule,
    MatDividerModule,
    MatDialogModule,
    MatCardModule,
    FlexLayoutModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatSelectModule,
    MatTabsModule,
    MatGridListModule,
    NgxFileDropModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatListModule,
    MatOptionModule,
    FindingsModule,
    PanelSectionModule,
    MatProgressBarModule,
    AppHeaderComponent,
    JobLogsComponent,
    CodeEditorComponent,
    JobLogsSummaryComponent,
  ],
  providers: [{ provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }],
})
export class DefaultModule {}
