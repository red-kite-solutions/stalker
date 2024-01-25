import { MAT_COLOR_FORMATS, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { NgxFileDropModule } from 'ngx-file-drop';
import { CreateUserComponent } from 'src/app/modules/admin/create-user/create-user.component';
import { SettingsComponent } from 'src/app/modules/admin/settings/settings.component';
import { EditCompaniesComponent } from 'src/app/modules/companies/edit-companies/edit-companies.component';
import { JobLogsSummaryComponent } from 'src/app/modules/jobs/job-executions/job-execution-logs-summary.component';
import { ProfileComponent } from 'src/app/modules/user/profile/profile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SpinnerButtonComponent } from 'src/app/shared/widget/spinner-button/spinner-button.component';
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
    SettingsComponent,
    EditCompaniesComponent,
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
    SpinnerButtonComponent,
  ],
  providers: [{ provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }],
})
export class DefaultModule {}
