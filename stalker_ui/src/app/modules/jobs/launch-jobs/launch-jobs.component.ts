import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map, Subscription } from 'rxjs';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';
import { parse, parseDocument, stringify } from 'yaml';
import { AuthService } from '../../../api/auth/auth.service';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { JobOutputResponse, JobsSocketioClient, JobStatusUpdate } from '../../../api/jobs/jobs/jobs.socketio-client';
import { CompanySummary } from '../../../shared/types/company/company.summary';
import { JobListEntry, JobParameterDefinition, StartedJob } from '../../../shared/types/jobs/job.type';
import { getLogTimestamp } from '../../../utils/time.utils';

@Component({
  selector: 'app-launch-jobs',
  templateUrl: './launch-jobs.component.html',
  styleUrls: ['./launch-jobs.component.scss'],
})
export class LaunchJobsComponent implements OnDestroy {
  public code = '';
  public output = '';
  public language = 'yaml';
  public minimapEnabled = false;
  public theme: 'vs-dark' = 'vs-dark';
  public readonly = false;
  public currentStartedJob: StartedJob | undefined;
  public currentJobOutputSubscription: Subscription | undefined;
  public currentJobStatusSubscription: Subscription | undefined;
  public jobLoading = false;
  private socketioClient: JobsSocketioClient | undefined;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<JobListEntry>();

  public selectedRow: JobListEntry | undefined;
  public currentJobName = '';
  public currentJobSource = '';
  public data = new Array<JobListEntry>();

  public dataSource$ = this.refreshData();

  selectedCompany: string | undefined = undefined;
  companies: CompanySummary[] = [];
  companies$ = this.companiesService.getAllSummaries().pipe(
    map((next: any[]) => {
      const comp: CompanySummary[] = [];
      for (const company of next) {
        comp.push({ id: company._id, name: company.name });
      }
      this.companies = comp;
      return this.companies;
    })
  );

  constructor(
    private codeEditorService: CodeEditorService,
    private jobsService: JobsService,
    private toastr: ToastrService,
    private companiesService: CompaniesService,
    private titleService: Title,
    public authService: AuthService
  ) {
    this.codeEditorService.load();
    this.titleService.setTitle($localize`:Launch Jobs|:Launch Jobs`);
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
    this.clearSubscriptionsAndSockets();
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
      this.socketioClient = new JobsSocketioClient(this.authService);

      this.jobLoading = true;
      if (this.selectedCompany) {
        this.currentStartedJob = await this.jobsService.startJob(
          this.currentJobName,
          this.currentJobSource,
          parameters,
          this.selectedCompany
        );
      } else {
        this.currentStartedJob = await this.jobsService.startJob(
          this.currentJobName,
          this.currentJobSource,
          parameters
        );
      }

      this.output = $localize`:Publish Job Log|:${getLogTimestamp(this.currentStartedJob.publishTime)} Job ${
        this.currentJobName
      } published with id ${this.currentStartedJob.id}\n`;

      this.currentJobOutputSubscription = this.socketioClient.jobOutput.subscribe((res: JobOutputResponse) => {
        this.output += `${getLogTimestamp(res.timestamp)} ${res.value}\n`;
      });

      this.currentJobStatusSubscription = this.socketioClient.jobStatus.subscribe((update: JobStatusUpdate) => {
        switch (update.status) {
          case 'started':
            this.output += $localize`:Job started|The orchestrator signaled that the job started:${getLogTimestamp(
              update.timestamp
            )} Job started\n`;
            break;
          case 'success':
            this.output += $localize`:Job success|The orchestrator signaled that the job is done and was a success:${getLogTimestamp(
              update.timestamp
            )} Job finished\n`;
            this.jobLoading = false;
            this.socketioClient?.disconnect();
            break;
          default:
            break;
        }
      });

      this.socketioClient.sendMessage({ jobId: this.currentStartedJob.id });
    } catch {
      this.jobLoading = false;
      this.clearSubscriptionsAndSockets();
      this.toastr.error(
        $localize`:Error while starting job|There was an error while starting the job:Error while starting job`
      );
    }
  }

  clearSubscriptionsAndSockets() {
    if (this.currentJobOutputSubscription) this.currentJobOutputSubscription.unsubscribe();
    if (this.currentJobStatusSubscription) this.currentJobStatusSubscription.unsubscribe();
    if (this.socketioClient && this.socketioClient.isConnected()) {
      this.socketioClient.disconnect();
    }
  }

  ngOnDestroy(): void {
    this.clearSubscriptionsAndSockets();
  }
}
