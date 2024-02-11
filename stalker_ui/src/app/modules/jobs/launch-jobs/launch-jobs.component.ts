import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { NgxFileDropModule } from 'ngx-file-drop';
import { ToastrService } from 'ngx-toastr';
import { Observable, map } from 'rxjs';
import { ThemeService } from 'src/app/services/theme.service';
import { JobLogsComponent } from 'src/app/shared/components/job-logs/job-logs.component';
import { AppHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { PanelSectionModule } from 'src/app/shared/components/panel-section/panel-section.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { SpinnerButtonComponent } from 'src/app/shared/widget/spinner-button/spinner-button.component';
import { parse, parseDocument, stringify } from 'yaml';
import { AuthService } from '../../../api/auth/auth.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { JobListEntry, JobParameterDefinition, StartedJob } from '../../../shared/types/jobs/job.type';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { CodeEditorComponent, CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';
import { FindingsModule } from '../../findings/findings.module';
import { JobLogsSummaryComponent } from '../job-executions/job-execution-logs-summary.component';

@Component({
  standalone: true,
  selector: 'app-launch-jobs',
  templateUrl: './launch-jobs.component.html',
  styleUrls: ['./launch-jobs.component.scss'],
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
})
export class LaunchJobsComponent {
  public code = '';
  public language = 'yaml';
  public minimapEnabled = false;
  public readonly = false;
  public currentStartedJob: StartedJob | undefined;
  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<JobListEntry>();

  public selectedRow: JobListEntry | undefined;
  public currentJobName = '';
  public currentJobSource = '';
  public data = new Array<JobListEntry>();

  public dataSource$ = this.refreshData();

  selectedProject: string | undefined = undefined;
  projects: ProjectSummary[] = [];
  projects$ = this.projectsService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: ProjectSummary[] = [];
      for (const project of next) {
        comp.push({ id: project._id, name: project.name });
      }
      this.projects = comp;
      return this.projects;
    })
  );

  constructor(
    private jobsService: JobsService,
    private toastr: ToastrService,
    private projectsService: ProjectsService,
    private titleService: Title,
    public authService: AuthService,
    private themeService: ThemeService
  ) {
    this.titleService.setTitle($localize`:Launch jobs|:Launch jobs`);
  }

  private refreshData() {
    return this.jobsService.getJobSummaries().pipe(
      map((data: JobListEntry[]) => {
        this.data = data;
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      })
    );
  }

  public selectJob(row: JobListEntry) {
    this.selectedRow = row;
    const rowData = this.data.find((v) => v.name === this.selectedRow?.name);
    if (rowData?.name) this.currentJobName = rowData.name;
    if (rowData?.source) this.currentJobSource = rowData.source;
    this.code = this.formatYamlFromJob(rowData);
  }

  private formatYamlFromJob(job: JobListEntry | undefined): string {
    if (!job) return '';
    const jobCopy = <Partial<JobListEntry>>JSON.parse(JSON.stringify(job));
    delete jobCopy.name;
    delete jobCopy.source;
    if (!jobCopy.parameters) return '';
    jobCopy.parameters = jobCopy.parameters.map((item: JobParameterDefinition) => {
      return { name: item.name, type: item.type, value: item.default === undefined ? 'Change Me' : item.default };
    });
    const jobYml: any = parseDocument(stringify(jobCopy));

    const parameters = jobYml.contents.items[0].value;

    if (!parameters.items) {
      return jobYml.toString();
    }

    // Gets the value of the 'type' field to set it as a comment
    // It will help the user in knowing what to put in the 'value'
    for (const param of parameters.items) {
      const index = param.items.findIndex((kv: any) => kv.key.value === 'type');
      const comment = ' Expecting type ' + param.items[index].value.value;
      param.items.splice(index, 1);

      param.items.find((kv: any) => kv.key.value === 'value').value.comment = comment;
    }

    return jobYml.toString();
  }

  public async startJob() {
    if (!this.currentJobName) {
      this.toastr.error($localize`:Select a job to run|No job were selected as a target to run:Select a job to run`);
      return;
    }

    let parameters;
    try {
      parameters = parse(this.code).parameters;
    } catch {
      this.toastr.error($localize`:Yaml syntax error|The yaml was not in the expected format:Yaml syntax error`);
      return;
    }

    if (!parameters) {
      this.toastr.error(
        $localize`:Missing Yaml field parameters|The yaml was missing the field named parameters:Missing Yaml field parameters`
      );
      return;
    }

    try {
      if (this.selectedProject) {
        this.currentStartedJob = await this.jobsService.startJob(
          this.currentJobName,
          this.currentJobSource,
          parameters,
          this.selectedProject
        );
      } else {
        this.currentStartedJob = await this.jobsService.startJob(
          this.currentJobName,
          this.currentJobSource,
          parameters
        );
      }
    } catch {
      this.toastr.error(
        $localize`:Error while starting job|There was an error while starting the job:Error while starting job`
      );
    }
  }
}
