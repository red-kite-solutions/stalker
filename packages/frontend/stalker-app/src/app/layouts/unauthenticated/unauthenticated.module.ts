import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AuthModule } from '../../modules/auth/auth.module';
import { SharedModule } from '../../shared/shared.module';
import { UnauthenticatedComponent } from './unauthenticated.component';

@NgModule({
  declarations: [UnauthenticatedComponent],
  imports: [CommonModule, RouterModule, MatSidenavModule, SharedModule, AuthModule],
})
export class UnauthenticatedModule {}
