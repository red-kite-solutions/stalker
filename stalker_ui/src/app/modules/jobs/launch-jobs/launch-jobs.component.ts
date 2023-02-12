import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map, Subscription } from 'rxjs';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';
import { parse, parseDocument, stringify } from 'yaml';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { JobOutputResponse, SocketioService } from '../../../api/socketio/socketio.service';
import { CompanySummary } from '../../../shared/types/company/company.summary';
import { JobInput, JobListEntry, JobParameterDefinition, StartedJob } from '../../../shared/types/jobs/job.type';
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<JobListEntry>();

  public selectedRow: JobListEntry | undefined;
  public currentJobName = '';
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
    private dialog: MatDialog,
    private jobsService: JobsService,
    private toastr: ToastrService,
    private companiesService: CompaniesService,
    private titleService: Title,
    private socketioService: SocketioService
  ) {
    this.codeEditorService.load();
    this.titleService.setTitle($localize`:Launch Jobs|:Launch Jobs`);
  }

  private refreshData() {
    return this.jobsService.getJobs().pipe(
      map((data) => {
        const d = data.map((job: JobInput): JobListEntry => {
          return { ...job, source: 'Stalker' };
        });
        this.data = d;
        this.dataSource.data = d;
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
    delete jobCopy.source;
    if (!jobCopy.parameters) return '';
    jobCopy.parameters = jobCopy.parameters.map((item: JobParameterDefinition) => {
      return { name: item.name, type: item.type, value: item.default === undefined ? 'Change Me' : item.default };
    });
    const jobYml: any = parseDocument(stringify(jobCopy));

    const parameters = jobYml.contents.items[0].value;

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
      if (this.selectedCompany) {
        this.currentStartedJob = await this.jobsService.startJob(this.currentJobName, parameters, this.selectedCompany);
      } else {
        this.currentStartedJob = await this.jobsService.startJob(this.currentJobName, parameters);
      }

      this.output = $localize`:Starting Job Log|:${getLogTimestamp(this.currentStartedJob.startTime)} Starting job ${
        this.currentJobName
      } with id ${this.currentStartedJob.id}\n`;

      if (this.currentJobOutputSubscription) this.currentJobOutputSubscription.unsubscribe();
      this.currentJobOutputSubscription = this.socketioService.jobOutput.subscribe((res: JobOutputResponse) => {
        this.output += `${res.output}\n`;
      });

      this.socketioService.sendMessage({ jobId: this.currentStartedJob.id });
    } catch {
      this.toastr.error(
        $localize`:Error while starting job|There was an error while starting the job:Error while starting job`
      );
    }
  }

  ngOnDestroy(): void {
    if (this.currentJobOutputSubscription) this.currentJobOutputSubscription.unsubscribe();
  }
}
