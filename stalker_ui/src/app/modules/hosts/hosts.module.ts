import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

import { ListHostsComponent } from './list-hosts/list-hosts.component';

const routes: Routes = [
  {
    path: '',
    component: ListHostsComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    SharedModule,
    FormsModule,
    MatButtonModule,
    MatTableModule,
    RouterModule.forChild(routes),
  ],
  exports: [],
  declarations: [ListHostsComponent],
  providers: [],
})
export class HostsListModule {}
