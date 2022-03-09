import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DefaultComponent } from './default.component';
import { DashboardComponent } from 'src/app/modules/dashboard/dashboard.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ProfileComponent } from 'src/app/modules/user/profile/profile.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ManageUsersComponent } from 'src/app/modules/admin/manage-users/manage-users.component';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CreateUserComponent } from 'src/app/modules/admin/create-user/create-user.component';
import { EditUserComponent } from 'src/app/modules/admin/edit-user/edit-user.component';
import { MatSelectModule } from '@angular/material/select';
import { SettingsComponent } from 'src/app/modules/admin/settings/settings.component';
import { MatTabsModule } from '@angular/material/tabs';


@NgModule({
  declarations: [
    DefaultComponent,
    DashboardComponent,
    ProfileComponent,
    ManageUsersComponent,
    CreateUserComponent,
    EditUserComponent,
    SettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    MatSidenavModule,
    MatDividerModule,
    MatCardModule,
    FlexLayoutModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCheckboxModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatSelectModule,
    MatTabsModule
  ]
})
export class DefaultModule { }
