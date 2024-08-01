import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableDataSource } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { AvatarComponent } from '../../../components/avatar/avatar.component';
import { IdentifiedElement } from '../../../types/identified-element.type';
import { MenuIconComponent } from '../../dynamic-icons/menu-icon.component';

export interface ElementMenuItems {
  label: string;
  icon: string;
  action: () => Promise<unknown> | void;
  hidden?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-grid-format',
  templateUrl: './grid-format.component.html',
  styleUrls: ['./grid-format.component.scss'],
  imports: [
    CommonModule,
    AvatarComponent,
    MatDividerModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatOptionModule,
    MatCardModule,
    MenuIconComponent,
  ],
})
export class GridFormatComponent<T extends IdentifiedElement> {
  // get the title template
  @ContentChild('title', { read: TemplateRef }) titleTemplate!: TemplateRef<any>;
  // get the body template
  @ContentChild('body', { read: TemplateRef }) bodyTemplate!: TemplateRef<any>;

  _dataSource!: MatTableDataSource<T>;
  @Input() set dataSource(data: MatTableDataSource<T> | null) {
    this._dataSource = data || new MatTableDataSource<T>([]);
    this.selection.setSelection(
      ...this._dataSource.data.filter((newRow: T) => {
        return this.selection.selected.some((selectedRow: T) => {
          const newRowId = selectedRow._id ? selectedRow._id : selectedRow.id;
          const selectedRowId = newRow._id ? newRow._id : newRow.id;
          return newRowId === selectedRowId;
        });
      })
    );
    this.selectionChange.emit(this.selection);
  }

  @Input() noDataMessage: string =
    $localize`:No data|No data is matching the filter, the array is empty:No matching data.`;
  @Input() routerLinkPrefix = '/';
  @Input() routerLinkBuilder: ((row: T) => string | any[] | null | undefined) | undefined = undefined;
  @Input() elementLinkActive = true;
  @Input() queryParamsFunc: (row: T) => {} = () => ({});
  @Input() menuFactory?: (element: T) => ElementMenuItems[];

  @Output() selectionChange = new EventEmitter<SelectionModel<T>>();
  @Input() selection = new SelectionModel<T>(true, []);
  @Input() gridColumns: number = 3;

  gridClassesMapping: string[] = [
    'tw-grid-cols-1',
    'tw-grid-cols-2',
    'tw-grid-cols-3',
    'tw-grid-cols-4',
    'tw-grid-cols-5',
    'tw-grid-cols-6',
    'tw-grid-cols-7',
    'tw-grid-cols-8',
  ];

  masterToggleState = false;

  constructor() {}

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this._dataSource?.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.masterToggleState = false;
    } else {
      this.selection.select(...this._dataSource.data);
      this.masterToggleState = true;
    }
    this.selectionChange.emit(this.selection);
  }

  toggleSelectedRow(row: T) {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection);
  }
}
