import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';

import { PortDetailsComponent } from './port-details.component';

@NgModule({
  imports: [CommonModule, SharedModule, MatListModule, MatIconModule, MatDividerModule, RouterModule],
  exports: [PortDetailsComponent],
  declarations: [PortDetailsComponent],
  providers: [],
})
export class PortDetailsModule {}
