import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { HighchartsChartModule } from 'highcharts-angular';
import { NgxFileDropModule } from 'ngx-file-drop';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HumanizePipe } from './pipes/humanize.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { WhereIdPipe } from './pipes/where-id.pipe';
import { AreaComponent } from './widget/area/area.component';
import { CardComponent } from './widget/card/card.component';
import { CodeEditorComponent } from './widget/code-editor/code-editor.component';
import { ConfirmDialogComponent } from './widget/confirm-dialog/confirm-dialog.component';
import { FilteredPaginatedTableComponent } from './widget/filtered-paginated-table/filtered-paginated-table.component';
import { ImageUploadComponent } from './widget/image-upload/image-upload.component';
import { PillTagComponent } from './widget/pill-tag/pill-tag.component';
import { SpinnerButtonComponent } from './widget/spinner-button/spinner-button.component';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    AreaComponent,
    CardComponent,
    ConfirmDialogComponent,
    SpinnerButtonComponent,
    ImageUploadComponent,
    FilteredPaginatedTableComponent,
    WhereIdPipe,
    PillTagComponent,
    TimeAgoPipe,
    HumanizePipe,
    CodeEditorComponent,
  ],
  imports: [
    CommonModule,
    MatDividerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    FlexLayoutModule,
    MatMenuModule,
    MatListModule,
    RouterModule,
    HighchartsChartModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    NgxFileDropModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    AreaComponent,
    CardComponent,
    ConfirmDialogComponent,
    SpinnerButtonComponent,
    ImageUploadComponent,
    FilteredPaginatedTableComponent,
    WhereIdPipe,
    PillTagComponent,
    TimeAgoPipe,
    HumanizePipe,
    CodeEditorComponent,
  ],
})
export class SharedModule {}
