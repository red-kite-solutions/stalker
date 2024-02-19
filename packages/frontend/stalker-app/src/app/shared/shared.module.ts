import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { NgxFileDropModule } from 'ngx-file-drop';
import { AvatarComponent } from './components/avatar/avatar.component';
import { HeaderComponent } from './components/header/header.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HumanizeDatePipe } from './pipes/humanize-date.pipe';
import { HumanizePipe } from './pipes/humanize.pipe';
import { MemoryUnitsPipe } from './pipes/memory-units.pipe';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { WhereIdPipe } from './pipes/where-id.pipe';
import { CodeEditorComponent } from './widget/code-editor/code-editor.component';
import { ConfirmDialogComponent } from './widget/confirm-dialog/confirm-dialog.component';
import { ImageUploadComponent } from './widget/image-upload/image-upload.component';
import { PillTagComponent } from './widget/pill-tag/pill-tag.component';
import { SpinnerButtonComponent } from './widget/spinner-button/spinner-button.component';
import { TextMenuComponent } from './widget/text-menu/text-menu.component';
import { TextSelectMenuComponent } from './widget/text-select-menu/text-select-menu.component';

@NgModule({
  declarations: [
    HeaderComponent,
    SidebarComponent,
    ConfirmDialogComponent,
    ImageUploadComponent,
    WhereIdPipe,
    PillTagComponent,
    TimeAgoPipe,
    HumanizePipe,
    HumanizeDatePipe,
    MemoryUnitsPipe,
    TextSelectMenuComponent,
  ],
  imports: [
    CommonModule,
    AvatarComponent,
    MatDividerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
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
    TextMenuComponent,
    SpinnerButtonComponent,
  ],
  exports: [
    HeaderComponent,
    SidebarComponent,
    ConfirmDialogComponent,
    ImageUploadComponent,
    WhereIdPipe,
    PillTagComponent,
    TimeAgoPipe,
    HumanizePipe,
    HumanizeDatePipe,
    MemoryUnitsPipe,
    CodeEditorComponent,
    TextSelectMenuComponent,
  ],
})
export class SharedModule {}
