import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';
import { parseDocument, stringify } from 'yaml';
import { CompaniesService } from '../../../api/companies/companies.service';
import { JobsService } from '../../../api/jobs/jobs/jobs.service';
import { CompanySummary } from '../../../shared/types/company/company.summary';
import { Job, JobListEntry } from '../../../shared/types/jobs/job.type';

@Component({
  selector: 'app-launch-jobs',
  templateUrl: './launch-jobs.component.html',
  styleUrls: ['./launch-jobs.component.scss'],
})
export class LaunchJobsComponent {
  public code = '';
  public output = '';
  public language = 'yaml';
  public minimapEnabled = false;
  public theme: 'vs-dark' = 'vs-dark';
  public readonly = false;

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
    private titleService: Title
  ) {
    this.codeEditorService.load();
    this.titleService.setTitle($localize`:Launch Jobs|:Launch Jobs`);
  }

  private refreshData() {
    return this.jobsService.getJobs().pipe(
      map((data) => {
        const d = data.map((job: Job): JobListEntry => {
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
    const jobCopy = JSON.parse(JSON.stringify(job));
    delete jobCopy.name;
    delete jobCopy.source;
    jobCopy.parameters = jobCopy.parameters.map((item: any) => {
      return { ...item, value: 'Change Me' };
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

  public startJob() {
    console.log('Start Job');
  }
}
