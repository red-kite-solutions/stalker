import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Title } from '@angular/platform-browser';
import { LatestJobs } from './latest-jobs/latest-jobs.component';
import { NumberOfDomainsMetric } from './number-of-domains-metric/number-of-domains-metric.component';
import { NumberOfHostsMetric } from './number-of-hosts-metric/number-of-hosts-metric.component';
import { SimpleMetric } from './simple-metric/simple-metric.component';
import { TopCompanies } from './top-companies/top-companies.component';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [SimpleMetric, MatCardModule, NumberOfDomainsMetric, NumberOfHostsMetric, TopCompanies, LatestJobs],
})
export class DashboardComponent {
  constructor(private titleService: Title) {
    this.titleService.setTitle($localize`Dashboard`);
  }
}
