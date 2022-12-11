import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
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
import { SharedModule } from '../../../shared/shared.module';
import { DomainDetailsModule } from '../../domains/domain-details/domains-details.module';
import { FindingsModule } from '../../findings/findings.module';
import { PortDetailsModule } from '../../ports/port-details/port-details.module';

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
    FlexLayoutModule,
    DomainDetailsModule,
    PortDetailsModule,
    FindingsModule,
  ],
  exports: [ViewHostComponent],
  declarations: [ViewHostComponent],
  providers: [],
})
export class ViewHostModule {}
