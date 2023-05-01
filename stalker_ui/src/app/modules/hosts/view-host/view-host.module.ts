import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { PanelSectionModule } from '../../../shared/components/panel-section/panel-section.module';
import { SharedModule } from '../../../shared/shared.module';
import { FindingsModule } from '../../findings/findings.module';
import { ViewHostComponent } from './view-host.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatSidenavModule,
    MatButtonModule,
    MatInputModule,
    MatProgressSpinnerModule,
    FormsModule,
    FindingsModule,
    RouterModule,
    PanelSectionModule,
    AppHeaderComponent,
  ],
  exports: [ViewHostComponent],
  declarations: [ViewHostComponent],
  providers: [],
})
export class ViewHostModule {}
