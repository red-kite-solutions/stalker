import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { SharedModule } from '../../shared/shared.module';
import { FindingComponent } from './finding/finding.component';
import { FindingsListComponent } from './findings-list/findings-list.component';
import { ImageFindingFieldComponent } from './image-finding-field/image-finding-field.component';
import { TextFindingFieldComponent } from './text-finding-field/text-finding-field.component';

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    SharedModule,
  ],
  declarations: [FindingsListComponent, FindingComponent, ImageFindingFieldComponent, TextFindingFieldComponent],
  exports: [FindingsListComponent, FindingComponent, ImageFindingFieldComponent, TextFindingFieldComponent],
  providers: [],
})
export class FindingsModule {}
