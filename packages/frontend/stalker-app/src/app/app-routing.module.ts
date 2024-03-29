import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './error-pages/not-found/not-found.component';
import { DefaultComponent } from './layouts/default/default.component';
import { UnauthenticatedComponent } from './layouts/unauthenticated/unauthenticated.component';
import { AuthComponent } from './modules/auth/auth.component';
import { FirstComponent } from './modules/auth/first/first.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { JobExecutionDetailComponent } from './modules/jobs/job-executions/job-execution-detail.component';
import { EditProjectsComponent } from './modules/projects/edit-projects/edit-projects.component';
import { ProfileComponent } from './modules/user/profile/profile.component';
import { hasUnsavedChangesGuard } from './shared/guards/unsaved-changes-can-deactivate.component';

const routes: Routes = [
  {
    path: '',
    component: DefaultComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./modules/dashboard/dashboard.component').then((c) => c.DashboardComponent),
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
        path: 'projects',
        loadComponent: () =>
          import('./modules/projects/list-projects/list-projects.component').then((c) => c.ListProjectsComponent),
      },
      {
        path: 'projects/:id',
        component: EditProjectsComponent,
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
        path: 'ports',
        loadChildren: () => import('./modules/ports/ports.module').then((m) => m.PortsListModule),
      },
      {
        path: 'tags',
        loadChildren: () => import('./modules/tags/tags.module').then((m) => m.TagsModule),
      },
      {
        path: 'jobs/subscriptions',
        loadComponent: () =>
          import('./modules/jobs/subscriptions/list-subscriptions.component').then((m) => m.ListSubscriptionsComponent),
      },
      {
        path: 'jobs/subscriptions/:id',
        canDeactivate: [hasUnsavedChangesGuard],
        loadComponent: () =>
          import('./modules/jobs/subscriptions/subscription.component').then((m) => m.SubscriptionComponent),
      },
      {
        path: 'jobs/custom',
        loadComponent: () =>
          import('./modules/jobs/custom-jobs/list-custom-jobs.component').then((m) => m.ListCustomJobsComponent),
      },
      {
        path: 'jobs/custom/:id',
        canDeactivate: [hasUnsavedChangesGuard],
        loadComponent: () =>
          import('./modules/jobs/custom-jobs/custom-jobs.component').then((m) => m.CustomJobsComponent),
      },
      {
        path: 'jobs/launch',

        loadComponent: () =>
          import('./modules/jobs/launch-jobs/launch-jobs.component').then((m) => m.LaunchJobsComponent),
      },
      {
        path: 'jobs/executions',
        loadComponent: () =>
          import('./modules/jobs/job-executions/job-executions.component').then((c) => c.JobExecutionsComponent),
      },
      {
        path: 'jobs/executions/:id',
        component: JobExecutionDetailComponent,
      },
      {
        path: 'secrets',
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
            component: LoginComponent,
          },
          {
            path: 'first',
            component: FirstComponent,
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
