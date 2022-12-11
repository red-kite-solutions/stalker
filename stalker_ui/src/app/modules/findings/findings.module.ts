import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from '../../shared/shared.module';
import { FindingComponent } from './finding/finding.component';
import { FindingsListComponent } from './findings-list.component';
import { ImageFindingFieldComponent } from './image-finding-field/image-finding-field.component';
import { TextFindingFieldComponent } from './text-finding-field/text-finding-field.component';

@NgModule({
  imports: [CommonModule, MatCardModule, SharedModule, FlexLayoutModule],
  declarations: [FindingsListComponent, FindingComponent, ImageFindingFieldComponent, TextFindingFieldComponent],
  exports: [FindingsListComponent, FindingComponent, ImageFindingFieldComponent, TextFindingFieldComponent],
  providers: [],
})
export class FindingsModule {}
