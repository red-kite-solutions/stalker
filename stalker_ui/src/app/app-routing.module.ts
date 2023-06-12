import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './error-pages/not-found/not-found.component';
import { DefaultComponent } from './layouts/default/default.component';
import { UnauthenticatedComponent } from './layouts/unauthenticated/unauthenticated.component';
import { AuthComponent } from './modules/auth/auth.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { EditCompaniesComponent } from './modules/companies/edit-companies/edit-companies.component';
import { ListCompaniesComponent } from './modules/companies/list-companies/list-companies.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { CustomJobsComponent } from './modules/jobs/custom-jobs/custom-jobs.component';
import { JobExecutionDetailComponent } from './modules/jobs/job-executions/job-execution-detail.component';
import { JobExecutionsComponent } from './modules/jobs/job-executions/job-executions.component';
import { LaunchJobsComponent } from './modules/jobs/launch-jobs/launch-jobs.component';
import { SubscriptionComponent } from './modules/jobs/subscriptions/subscription.component';
import { ProfileComponent } from './modules/user/profile/profile.component';

const routes: Routes = [
  {
    path: '',
    component: DefaultComponent,
    children: [
      {
        path: '',
        component: DashboardComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'admin',
        loadChildren: () => import('./modules/admin/admin.module').then((m) => m.AdminModule),
      },
      {
        path: 'companies',
        component: ListCompaniesComponent,
      },
      {
        path: 'companies/:id',
        component: EditCompaniesComponent,
      },
      {
        path: 'domains',
        loadChildren: () => import('./modules/domains/domains.module').then((m) => m.DomainsListModule),
      },
      {
        path: 'hosts',
        loadChildren: () => import('./modules/hosts/hosts.module').then((m) => m.HostsListModule),
      },
      {
        path: 'tags',
        loadChildren: () => import('./modules/tags/tags.module').then((m) => m.TagsModule),
      },
      {
        path: 'jobs/subscriptions',
        component: SubscriptionComponent,
      },
      {
        path: 'jobs/custom',
        component: CustomJobsComponent,
      },
      {
        path: 'jobs/launch',
        component: LaunchJobsComponent,
      },
      {
        path: 'jobs/executions',
        component: JobExecutionsComponent,
      },
      {
        path: 'jobs/executions/:id',
        component: JobExecutionDetailComponent,
      },
    ],
  },
  {
    path: 'auth',
    component: UnauthenticatedComponent,
    children: [
      {
        path: '',
        component: AuthComponent,
        children: [
          {
            path: 'login',
            component: LoginComponent,
          },
        ],
      },
    ],
  },
  {
    path: '**',
    component: UnauthenticatedComponent,
    children: [
      {
        path: '**',
        component: NotFoundComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
