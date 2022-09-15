import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './error-pages/not-found/not-found.component';
import { DefaultComponent } from './layouts/default/default.component';
import { UnauthenticatedComponent } from './layouts/unauthenticated/unauthenticated.component';
import { CreateUserComponent } from './modules/admin/create-user/create-user.component';
import { EditUserComponent } from './modules/admin/edit-user/edit-user.component';
import { ManageUsersComponent } from './modules/admin/manage-users/manage-users.component';
import { SettingsComponent } from './modules/admin/settings/settings.component';
import { AuthComponent } from './modules/auth/auth.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { EditCompaniesComponent } from './modules/companies/edit-companies/edit-companies.component';
import { ListCompaniesComponent } from './modules/companies/list-companies/list-companies.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
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
        path: 'admin/users',
        component: ManageUsersComponent,
      },
      {
        path: 'admin/users/create',
        component: CreateUserComponent,
      },
      {
        path: 'admin/users/:id',
        component: EditUserComponent,
      },
      {
        path: 'admin/settings',
        component: SettingsComponent,
      },
      {
        path: 'companies',
        component: ListCompaniesComponent,
      },
      {
        path: 'companies/:id',
        component: EditCompaniesComponent,
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
