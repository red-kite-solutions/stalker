import { Color } from '@angular-material-components/color-picker';
import { SelectionModel } from '@angular/cdk/collections';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { TagsService } from 'src/app/api/tags/tags.service';
import { Tag } from 'src/app/shared/types/tag.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-manage-tags',
  templateUrl: './manage-tags.component.html',
  styleUrls: ['./manage-tags.component.scss'],
})
export class ManageTagsComponent {
  @ViewChild(MatPaginator) paginator: MatPaginator | null;
  displayedColumns: string[] = ['select', 'firstName', 'lastName', 'email', 'role', 'active'];
  dataSource = new MatTableDataSource<Tag>();
  selection = new SelectionModel<Tag>(true, []);

  public newTagText = '';
  public newTagColor: Color = new Color(0, 0, 0);
  public placeholderColor: Color = new Color(0, 0, 0);
  public color: ThemePalette = 'primary';

  private refreshData() {
    return this.tagsService.getTags().pipe(
      map((next) => {
        this.dataSource.data = next;
        this.dataSource.paginator = this.paginator;
        if (this.paginator) {
          this.paginator._intl.itemsPerPageLabel = $localize`:Items per page|Paginator items per page label:Items per page`;
          this.paginator._intl.nextPageLabel = $localize`:Next page|Paginator next page label:Next page`;
          this.paginator._intl.lastPageLabel = $localize`:Last page|Paginator last page label:Last page`;
          this.paginator._intl.previousPageLabel = $localize`:Previous page|Paginator previous page label:Previous page`;
          this.paginator._intl.firstPageLabel = $localize`:First page|Paginator first page label:First page`;
          this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
            const low = page * pageSize + 1;
            const high = page * pageSize + pageSize <= length ? page * pageSize + pageSize : length;
            return $localize`:Paginator range|Item numbers and range of the paginator:${low} – ${high} of ${length}`;
          };
        }
      })
    );
  }
  public dataSource$ = this.refreshData();

  constructor(private tagsService: TagsService, public dialog: MatDialog, private toastr: ToastrService) {
    this.paginator = null;
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: Tag): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id + 1}`;
  }

  public deleteTags() {
    const bulletPoints: string[] = Array<string>();
    this.selection.selected.forEach((tag: Tag) => {
      bulletPoints.push(`${tag.text}`);
    });
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
            await this.tagsService.delete(tag.id);
            this.selection.deselect(tag);
            const removeIndex = this.dataSource.data.findIndex((t: Tag) => t.id === tag.id);
            this.dataSource.data.splice(removeIndex, 1);
            this.dataSource.paginator = this.paginator;
            this.toastr.success(
              $localize`:Tag deleted|Confirm the successful deletion of a tag:Tag deleted successfully`
            );
          });
          this.dialog.closeAll();
        },
      };
    } else {
      data = {
        text: $localize`:Select users again|No users were selected so there is nothing to delete:Select the users to delete and try again.`,
        title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
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
      const newTag = await this.tagsService.createTag(this.newTagText, '#' + this.newTagColor.hex);
      this.toastr.success($localize`:Tag created|Confirm the successful creation of a tag:Tag created successfully`);
      this.dataSource$ = this.refreshData();
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
