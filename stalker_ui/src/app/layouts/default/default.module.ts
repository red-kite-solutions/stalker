import {
  MAT_COLOR_FORMATS,
  NgxMatColorPickerModule,
  NGX_MAT_COLOR_FORMATS,
} from '@angular-material-components/color-picker';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
import { EditUserComponent } from 'src/app/modules/admin/edit-user/edit-user.component';
import { ManageUsersComponent } from 'src/app/modules/admin/manage-users/manage-users.component';
import { SettingsComponent } from 'src/app/modules/admin/settings/settings.component';
import { EditCompaniesComponent } from 'src/app/modules/companies/edit-companies/edit-companies.component';
import { ListCompaniesComponent } from 'src/app/modules/companies/list-companies/list-companies.component';
import { DashboardComponent } from 'src/app/modules/dashboard/dashboard.component';
import { ListDomainsComponent } from 'src/app/modules/domains/list-domains/list-domains.component';
import { ViewDomainComponent } from 'src/app/modules/domains/view-domain/view-domain.component';
import { SubscriptionComponent } from 'src/app/modules/jobs/subscriptions/subscription.component';
import { ManageTagsComponent } from 'src/app/modules/tags/manage-tags/manage-tags.component';
import { ProfileComponent } from 'src/app/modules/user/profile/profile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FindingsModule } from '../../modules/findings/findings.module';
import { ViewHostModule } from '../../modules/hosts/view-host/view-host.module';
import { ViewPortModule } from '../../modules/hosts/view-port/view-port.module';
import { CustomJobsComponent } from '../../modules/jobs/custom-jobs/custom-jobs.component';
import { JobExecutionDetailComponent } from '../../modules/jobs/job-executions/job-execution-detail.component';
import { JobLogsSummaryComponent } from '../../modules/jobs/job-executions/job-execution-logs-summary.component';
import { JobStateComponent } from '../../modules/jobs/job-executions/job-execution-state.component';
import { JobExecutionsComponent } from '../../modules/jobs/job-executions/job-executions.component';
import { LaunchJobsComponent } from '../../modules/jobs/launch-jobs/launch-jobs.component';
import { AppHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../shared/components/panel-section/panel-section.module';
import { DefaultComponent } from './default.component';

@NgModule({
  declarations: [
    DefaultComponent,
    DashboardComponent,
    ProfileComponent,
    ManageUsersComponent,
    CreateUserComponent,
    EditUserComponent,
    SettingsComponent,
    ListCompaniesComponent,
    EditCompaniesComponent,
    ListDomainsComponent,
    ViewDomainComponent,
    ManageTagsComponent,
    SubscriptionComponent,
    CustomJobsComponent,
    LaunchJobsComponent,
    JobExecutionsComponent,
    JobStateComponent,
    JobExecutionDetailComponent,
    JobLogsSummaryComponent,
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
    NgxMatColorPickerModule,
    ViewHostModule,
    ViewPortModule,
    FindingsModule,
    PanelSectionModule,
    MatProgressBarModule,
    AppHeaderComponent,
  ],
  providers: [{ provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }],
})
export class DefaultModule {}
