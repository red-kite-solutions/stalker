import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterModule } from '@angular/router';
import { AuthModule } from '../../modules/auth/auth.module';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SharedModule } from '../../shared/shared.module';
import { UnauthenticatedComponent } from './unauthenticated.component';

@NgModule({
  declarations: [UnauthenticatedComponent],
  imports: [HeaderComponent, CommonModule, RouterModule, MatSidenavModule, SharedModule, AuthModule],
})
export class UnauthenticatedModule {}
