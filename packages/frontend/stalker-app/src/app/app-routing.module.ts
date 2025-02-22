import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authenticationGuard } from './api/auth/auth.guard';
import { NotFoundComponent } from './error-pages/not-found/not-found.component';
import { DefaultComponent } from './layouts/default/default.component';
import { UnauthenticatedComponent } from './layouts/unauthenticated/unauthenticated.component';
import { AuthComponent } from './modules/auth/auth.component';
import { JobExecutionDetailComponent } from './modules/jobs/job-executions/job-execution-detail.component';
import { EditProjectsComponent } from './modules/projects/edit-projects/edit-projects.component';
import { hasUnsavedChangesGuard } from './shared/guards/unsaved-changes-can-deactivate.component';

const routes: Routes = [
  {
    path: '',
    component: DefaultComponent,
    children: [
      {
        path: '',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./modules/dashboard/dashboard.component').then((c) => c.DashboardComponent),
      },
      {
        path: 'profile',
        canActivate: [authenticationGuard],
        loadChildren: () => import('./modules/user/user.module').then((m) => m.UserModule),
      },
      {
        path: 'admin',
        canActivate: [authenticationGuard],
        loadChildren: () => import('./modules/admin/admin.module').then((m) => m.AdminModule),
      },
      {
        path: 'projects',
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./modules/projects/list-projects/list-projects.component').then((c) => c.ListProjectsComponent),
      },
      {
        path: 'projects/:id',
        canActivate: [authenticationGuard],
        component: EditProjectsComponent,
      },
      {
        path: 'domains',
        canActivate: [authenticationGuard],
        loadChildren: () => import('./modules/domains/domains.module').then((m) => m.DomainsListModule),
      },
      {
        path: 'hosts',
        canActivate: [authenticationGuard],
        loadChildren: () => import('./modules/hosts/hosts.module').then((m) => m.HostsListModule),
      },
      {
        path: 'ip-ranges',
        canActivate: [authenticationGuard],
        loadChildren: () => import('./modules/ip-ranges/ip-ranges.module').then((m) => m.IpRangesListModule),
      },
      {
        path: 'ports',
        canActivate: [authenticationGuard],
        loadChildren: () => import('./modules/ports/ports.module').then((m) => m.PortsListModule),
      },
      {
        path: 'websites',
        loadChildren: () => import('./modules/websites/websites.module').then((m) => m.WebsitesListModule),
      },
      {
        path: 'tags',
        canActivate: [authenticationGuard],
        loadChildren: () => import('./modules/tags/tags.module').then((m) => m.TagsModule),
      },
      {
        path: 'jobs/subscriptions',
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./modules/jobs/subscriptions/list-subscriptions.component').then((m) => m.ListSubscriptionsComponent),
      },
      {
        path: 'jobs/subscriptions/:id',
        canDeactivate: [hasUnsavedChangesGuard],
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./modules/jobs/subscriptions/subscription.component').then((m) => m.SubscriptionComponent),
      },
      {
        path: 'jobs/custom',
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./modules/jobs/custom-jobs/list-custom-jobs.component').then((m) => m.ListCustomJobsComponent),
      },
      {
        path: 'jobs/custom/:id',
        canDeactivate: [hasUnsavedChangesGuard],
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./modules/jobs/custom-jobs/custom-jobs.component').then((m) => m.CustomJobsComponent),
      },
      {
        path: 'jobs/launch',
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./modules/jobs/launch-jobs/launch-jobs.component').then((m) => m.LaunchJobsComponent),
      },
      {
        path: 'jobs/executions',
        canActivate: [authenticationGuard],
        loadComponent: () =>
          import('./modules/jobs/job-executions/job-executions.component').then((c) => c.JobExecutionsComponent),
      },
      {
        path: 'jobs/executions/:id',
        canActivate: [authenticationGuard],
        component: JobExecutionDetailComponent,
      },
      {
        path: 'secrets',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./modules/secrets/secrets.component').then((c) => c.SecretsComponent),
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
            loadComponent: () => import('./modules/auth/login/login.component').then((c) => c.LoginComponent),
          },
          {
            path: 'request-reset',
            loadComponent: () =>
              import('./modules/auth/request-reset/request-reset-password.component').then(
                (c) => c.RequestResetPasswordComponent
              ),
          },
          {
            path: 'reset',
            loadComponent: () =>
              import('./modules/auth/reset/reset-password.component').then((c) => c.ResetPasswordComponent),
          },
          {
            path: 'first',
            loadComponent: () =>
              import('./modules/auth/first-user/first-user.component').then((c) => c.FirstUserComponent),
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
