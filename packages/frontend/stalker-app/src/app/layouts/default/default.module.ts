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
import { CreateUserComponent } from '../../modules/admin/create-user/create-user.component';
import { SettingsComponent } from '../../modules/admin/settings/settings.component';
import { FindingsModule } from '../../modules/findings/findings.module';
import { JobLogsSummaryComponent } from '../../modules/jobs/job-executions/job-execution-logs-summary.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { JobLogsComponent } from '../../shared/components/job-logs/job-logs.component';
import { AppHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../shared/shared.module';
import { CodeEditorComponent } from '../../shared/widget/code-editor/code-editor.component';
import { SpinnerButtonComponent } from '../../shared/widget/spinner-button/spinner-button.component';
import { DefaultComponent } from './default.component';

@NgModule({
  declarations: [DefaultComponent, CreateUserComponent, SettingsComponent],
  imports: [
    HeaderComponent,
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
    AvatarComponent,
  ],
  providers: [{ provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS }],
})
export class DefaultModule {}
