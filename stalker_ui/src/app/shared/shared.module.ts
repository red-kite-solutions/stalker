import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatLegacyOptionModule as MatOptionModule } from '@angular/material/legacy-core';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RouterModule } from '@angular/router';
import { NgxFileDropModule } from 'ngx-file-drop';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HumanizeDatePipe } from './pipes/humanize-date.pipe';
import { HumanizePipe } from './pipes/humanize.pipe';
import { MemoryUnitsPipe } from './pipes/memory-units.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { WhereIdPipe } from './pipes/where-id.pipe';
import { CodeEditorComponent } from './widget/code-editor/code-editor.component';
import { ConfirmDialogComponent } from './widget/confirm-dialog/confirm-dialog.component';
import { FilteredPaginatedTableComponent } from './widget/filtered-paginated-table/filtered-paginated-table.component';
import { ImageUploadComponent } from './widget/image-upload/image-upload.component';
import { PillTagComponent } from './widget/pill-tag/pill-tag.component';
import { SpinnerButtonComponent } from './widget/spinner-button/spinner-button.component';
import { TextMenuComponent } from './widget/text-menu/text-menu.component';
import { TextSelectMenuComponent } from './widget/text-select-menu/text-select-menu.component';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    ConfirmDialogComponent,
    SpinnerButtonComponent,
    ImageUploadComponent,
    FilteredPaginatedTableComponent,
    WhereIdPipe,
    PillTagComponent,
    TimeAgoPipe,
    HumanizePipe,
    HumanizeDatePipe,
    MemoryUnitsPipe,
    TextSelectMenuComponent,
    TextMenuComponent,
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
    CodeEditorComponent,
    MatOptionModule,
    MatSelectModule,
    FormsModule,
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    ConfirmDialogComponent,
    SpinnerButtonComponent,
    ImageUploadComponent,
    FilteredPaginatedTableComponent,
    WhereIdPipe,
    PillTagComponent,
    TimeAgoPipe,
    HumanizePipe,
    HumanizeDatePipe,
    MemoryUnitsPipe,
    CodeEditorComponent,
    TextSelectMenuComponent,
    TextMenuComponent,
  ],
})
export class SharedModule {}
