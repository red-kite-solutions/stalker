import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationComponent } from './layouts/authentication/authentication.component';
import { DefaultComponent } from './layouts/default/default.component';
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
    path: 'admin/configs',
    component: ProfileComponent
  }]
},
{
  path: 'auth',
  component: AuthenticationComponent,
  children: [{
    path: 'login',
    component : LoginComponent
  }]

}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
