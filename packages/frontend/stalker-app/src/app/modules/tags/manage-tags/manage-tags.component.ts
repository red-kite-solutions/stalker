import { Color, NgxMatColorPickerModule } from '@angular-material-components/color-picker';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Component, Inject, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, map, shareReplay, switchMap, tap } from 'rxjs';
import { TagsService } from 'src/app/api/tags/tags.service';
import { Tag } from 'src/app/shared/types/tag.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { SharedModule } from '../../../shared/shared.module';
import { FilteredPaginatedTableComponent } from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import {
  TableFiltersSource,
  TableFiltersSourceBase,
} from '../../../shared/widget/filtered-paginated-table/table-filters-source';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    SharedModule,
    FormsModule,
    MatButtonModule,
    MatTableModule,
    ReactiveFormsModule,
    MatInputModule,
    MatCheckboxModule,
    NgxMatColorPickerModule,
    FilteredPaginatedTableComponent,
    TableFormatComponent,
  ],
  selector: 'app-manage-tags',
  templateUrl: './manage-tags.component.html',
  styleUrls: ['./manage-tags.component.scss'],
  providers: [{ provide: TableFiltersSourceBase, useClass: TableFiltersSource }],
})
export class ManageTagsComponent {
  exampleTagText = $localize`:Example|Example:Example`;
  selection = new SelectionModel<Tag>(true, []);
  public isLoading$ = new BehaviorSubject(true);

  public newTagText = '';
  public newTagColor: Color = new Color(0, 0, 0);
  public placeholderColor: Color = new Color(0, 0, 0);
  public color: ThemePalette = 'primary';
  public readonly noDataMessage = $localize`:No tag found|No tag was found for this item:No tag found`;

  private refresh$ = new BehaviorSubject(null);
  public tags$ = combineLatest([this.filtersSource.debouncedFilters$, this.refresh$]).pipe(
    switchMap(([{ filters, pagination }]) =>
      this.tagsService.getTags(filters, pagination?.page ?? 0, pagination?.pageSize ?? 25)
    ),
    shareReplay(1)
  );

  public dataSource$ = this.tags$.pipe(
    map((tags) => new MatTableDataSource<Tag>(tags.items)),
    tap(() => this.isLoading$.next(false))
  );

  constructor(
    private tagsService: TagsService,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private titleService: Title,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Manage tags page title|:Manage tags`);
  }

  public deleteTags() {
    const bulletPoints: string[] = Array<string>();

    for (const tag of this.selection.selected) {
      bulletPoints.push(tag.text);
    }

    let data: ConfirmDialogData;
    if (bulletPoints.length > 0) {
      data = {
        text: $localize`:Confirm delete tags|Confirmation message asking if the user really wants to delete the selected tags:Do you really wish to delete these tags permanently ?`,
        title: $localize`:Deleting tags|Title of a page to delete selected tags:Deleting tags`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: bulletPoints,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: () => {
          this.selection.selected.forEach(async (tag: Tag) => {
            await this.tagsService.delete(tag._id);
            this.selection.deselect(tag);
            this.refresh$.next(null);
            this.toastr.success(
              $localize`:Tag deleted|Confirm the successful deletion of a tag:Tag deleted successfully`
            );
          });
          this.dialog.closeAll();
        },
      };
    } else {
      data = {
        text: $localize`:Select tags again|No tags were selected so there is nothing to delete:Select the tags to delete and try again.`,
        title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
        noDataSelectItem: true,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
      };
    }

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  public async createTag() {
    try {
      if (!(this.newTagText && this.newTagColor.hex && /^[a-f0-9]{6}$/.test(this.newTagColor.hex))) {
        this.toastr.warning(
          $localize`:Invalid tag values|The values provided for the new tag are invalid:Invalid tag values`
        );
        return;
      }
      await this.tagsService.createTag(this.newTagText, '#' + this.newTagColor.hex);
      this.toastr.success($localize`:Tag created|Confirm the successful creation of a tag:Tag created successfully`);
      this.refresh$.next(null);
      this.newTagText = '';
      this.newTagColor = new Color(0, 0, 0);
      this.dialog.closeAll();
    } catch (err) {
      this.toastr.error(
        $localize`:Error while submitting tag|There was a server error while submitting the new tag:Error while submitting tag`
      );
    }
  }

  openNewTagDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }
}
