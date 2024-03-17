import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateUserComponent } from './create-user/create-user.component';
import { SettingsComponent } from './settings/settings.component';

const routes: Routes = [
  {
    path: 'users',
    children: [
      {
        path: 'create',
        component: CreateUserComponent,
      },
      {
        path: ':id',
        loadComponent: () => import('./edit-user/edit-user.component').then((m) => m.EditUserComponent),
      },
      {
        path: '',
        loadComponent: () => import('./manage-users/manage-users.component').then((m) => m.ManageUsersComponent),
      },
    ],
  },
  {
    path: 'settings',
    component: SettingsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [],
  providers: [],
})
export class AdminModule {}
