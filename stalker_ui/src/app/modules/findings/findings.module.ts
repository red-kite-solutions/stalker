import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SharedModule } from '../../shared/shared.module';
import { FindingComponent } from './finding/finding.component';
import { FindingsListComponent } from './findings-list/findings-list.component';
import { ImageFindingFieldComponent } from './image-finding-field/image-finding-field.component';
import { TextFindingFieldComponent } from './text-finding-field/text-finding-field.component';

@NgModule({
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatButtonModule, SharedModule],
  declarations: [FindingsListComponent, FindingComponent, ImageFindingFieldComponent, TextFindingFieldComponent],
  exports: [FindingsListComponent, FindingComponent, ImageFindingFieldComponent, TextFindingFieldComponent],
  providers: [],
})
export class FindingsModule {}
