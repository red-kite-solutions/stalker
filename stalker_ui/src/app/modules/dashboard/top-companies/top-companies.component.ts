import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { CompanyAvatarComponent } from 'src/app/shared/components/company-avatar/company-avatar.component';

@Component({
  standalone: true,
  selector: 'top-companies',
  template: `<span class="metric-title">Companies</span>
    <mat-list class="metric-list">
      <mat-list-item *ngFor="let company of companies$ | async">
        <span class="company">
          <company-avatar [company]="company"></company-avatar>
          <a class="metric-list-item" [routerLink]="['companies', company._id]">{{ company.name }}</a>
        </span>
      </mat-list-item>
    </mat-list>`,
  styleUrls: ['../metric-styling.scss', './top-companies.component.scss'],
  imports: [CommonModule, CompanyAvatarComponent, MatListModule, RouterModule],
})
export class TopCompanies {
  public companies$ = this.companiesService.getAll().pipe(map((x) => x.slice(0, 6)));

  constructor(private companiesService: CompaniesService) {}
}
