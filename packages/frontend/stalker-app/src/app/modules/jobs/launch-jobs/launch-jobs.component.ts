import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
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
import { BehaviorSubject, Observable, combineLatest, map, tap } from 'rxjs';
import { parse, parseDocument, stringify } from 'yaml';
import { AuthService } from '../../../api/auth/auth.service';
import { JobExecutionsService } from '../../../api/jobs/job-executions/job-executions.service';
import { ProjectsService } from '../../../api/projects/projects.service';
import { ThemeService } from '../../../services/theme.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { JobLogsComponent } from '../../../shared/components/job-logs/job-logs.component';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
import { JobListEntry, JobParameterDefinition, StartedJob } from '../../../shared/types/jobs/job.type';
import { ProjectSummary } from '../../../shared/types/project/project.summary';
import { CodeEditorComponent, CodeEditorTheme } from '../../../shared/widget/code-editor/code-editor.component';
import { SpinnerButtonComponent } from '../../../shared/widget/spinner-button/spinner-button.component';
import { normalizeSearchString } from '../../../utils/normalize-search-string';
import { FindingsModule } from '../../findings/findings.module';
import { JobExecutionInteractionsService } from '../job-executions/job-execution-interactions.service';

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
    AvatarComponent,
    SpinnerButtonComponent,
  ],
})
export class LaunchJobsComponent implements AfterViewInit {
  public code = '';
  public language = 'yaml';
  public minimapEnabled = false;
  public readonly = false;
  public currentStartedJob: StartedJob | undefined;
  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );

  public filterChange$ = new BehaviorSubject<string>('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<JobListEntry>();
  @ViewChild(JobLogsComponent) public logs!: JobLogsComponent;
  public jobIsStopping$ = new BehaviorSubject<boolean>(false);
  public jobIsRunning$!: Observable<boolean>;

  ngAfterViewInit(): void {
    this.jobIsRunning$ = this.logs.isJobInProgress$.pipe(
      tap((inProgress) => {
        if (!inProgress) {
          this.jobIsStopping$.next(false);
        }
      })
    );
  }

  public selectedRow: JobListEntry | undefined;
  public currentJobName = '';
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
    private jobsService: JobExecutionsService,
    private toastr: ToastrService,
    private projectsService: ProjectsService,
    private titleService: Title,
    public authService: AuthService,
    private themeService: ThemeService,
    private jobExecutionInteractionsService: JobExecutionInteractionsService
  ) {
    this.titleService.setTitle($localize`:Launch jobs|:Launch jobs`);
  }

  private refreshData() {
    return combineLatest([this.filterChange$, this.jobsService.getJobSummaries()]).pipe(
      map(([filter, data]) => {
        this.data = data.filter((x) => this.filterJob(x, filter));
        this.dataSource.data = this.data;
        this.dataSource.paginator = this.paginator;
      })
    );
  }

  public selectJob(row: JobListEntry) {
    this.selectedRow = row;
    const rowData = this.data.find((v) => v.name === this.selectedRow?.name);
    if (rowData?.name) this.currentJobName = rowData.name;
    this.code = this.formatYamlFromJob(rowData);
  }

  private formatYamlFromJob(job: JobListEntry | undefined): string {
    if (!job) return '';
    const jobCopy = <Partial<JobListEntry>>JSON.parse(JSON.stringify(job));
    delete jobCopy.name;
    delete jobCopy.builtIn;
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
      this.currentStartedJob = await this.jobsService.startJob(
        this.currentJobName,
        parameters,
        this.selectedProject ?? undefined
      );
      this.jobIsStopping$.next(false);
    } catch {
      this.toastr.error(
        $localize`:Error while starting job|There was an error while starting the job:Error while starting job`
      );
    }
  }

  public async stopJob() {
    const result = await this.jobExecutionInteractionsService.stopJob(this.currentStartedJob!.id);

    if (result) {
      this.jobIsStopping$.next(true);
    }
  }

  private filterJob(entry: JobListEntry, filter: string) {
    const parts = [entry.name];
    return normalizeSearchString(parts.join(' ')).includes(filter);
  }
}
