import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './error-pages/not-found/not-found.component';
import { AuthenticationComponent } from './layouts/authentication/authentication.component';
import { DefaultComponent } from './layouts/default/default.component';
import { CreateUserComponent } from './modules/admin/create-user/create-user.component';
import { EditUserComponent } from './modules/admin/edit-user/edit-user.component';
import { ManageUsersComponent } from './modules/admin/manage-users/manage-users.component';
import { LoginComponent } from './modules/auth/login/login.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { ProfileComponent } from './modules/user/profile/profile.component';

const routes: Routes = [{
  path: '',
  component: DefaultComponent,
  children : [{
    path: '',
    component: DashboardComponent
  },
  {
    path: 'profile',
    component: ProfileComponent
  },
  {
    path: 'admin/users',
    component: ManageUsersComponent
  },
  {
    path: 'admin/users/create',
    component: CreateUserComponent
  },
  {
    path: 'admin/users/:id',
    component: EditUserComponent
  },
  {
    path: 'admin/configs',
    component: ProfileComponent
  }
  ]
},
{
  path: 'auth',
  component: AuthenticationComponent,
  children: [{
    path: 'login',
    component : LoginComponent
  }]
},
{
  path: '**',
  component: NotFoundComponent
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
