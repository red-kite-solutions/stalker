import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { map } from 'rxjs';
import { TagsService } from 'src/app/api/tags/tags.service';
import { Tag } from 'src/app/shared/types/tag.type';

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

  public dataSource$ = this.tagsService.getTags().pipe(
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

  constructor(private tagsService: TagsService) {
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

  public deleteTags() {}
}
