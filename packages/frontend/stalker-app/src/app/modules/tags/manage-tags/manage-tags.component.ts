import { Color, NgxMatColorPickerModule } from '@angular-material-components/color-picker';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, TemplateRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ThemePalette } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Subject, combineLatest, debounceTime, map, scan, shareReplay, switchMap, tap } from 'rxjs';
import { TagsService } from 'src/app/api/tags/tags.service';
import { Tag } from 'src/app/shared/types/tag.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { SharedModule } from '../../../shared/shared.module';
import { FilteredPaginatedTableComponent } from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';

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
  ],
  selector: 'app-manage-tags',
  templateUrl: './manage-tags.component.html',
  styleUrls: ['./manage-tags.component.scss'],
})
export class ManageTagsComponent implements AfterViewInit {
  selection = new SelectionModel<Tag>(true, []);
  public isLoading$ = new BehaviorSubject(true);
  private filters$ = new BehaviorSubject<string[]>([]);
  private deleted$ = new BehaviorSubject<string[]>([]);
  private created$ = new BehaviorSubject<Tag[]>([]);
  private paging$ = new Subject<PageEvent>();

  private createdTags$ = this.created$.pipe(
    scan((newSecret, previousNewSecrets) => {
      return previousNewSecrets.concat(newSecret);
    })
  );

  private deletedTags$ = this.deleted$.pipe(
    scan((deleted, previous) => {
      return previous.concat(deleted);
    })
  );

  public newTagText = '';
  public newTagColor: Color = new Color(0, 0, 0);
  public placeholderColor: Color = new Color(0, 0, 0);
  public color: ThemePalette = 'primary';
  public readonly noDataMessage = $localize`:No tag found|No tag was found for this item:No tag found`;

  public tags$ = combineLatest([this.createdTags$, this.tagsService.getTags(), this.deletedTags$]).pipe(
    map(([createdTags, dbTags, deletedTags]) =>
      dbTags.concat(createdTags).filter((v) => !deletedTags.some((d) => v._id === d))
    ),
    map((tags) => tags.sort((a, b) => a._id.localeCompare(b._id))),
    switchMap((tags) =>
      this.filters$.pipe(
        debounceTime(250),
        map((filters) => filters.map((filter) => this.normalizeString(filter))),
        map((filters) => tags.filter((sub) => !filters.length || this.filterSecret(sub, filters)))
      )
    ),
    shareReplay(1)
  );

  public dataSource$ = combineLatest([this.tags$, this.paging$]).pipe(
    map(([secrets, paging]) => {
      const start = paging.pageIndex * paging.pageSize;
      let end = start + paging.pageSize;
      end = end < secrets.length ? end : secrets.length;
      return new MatTableDataSource<Tag>(secrets.slice(start, end));
    }),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private tagsService: TagsService,
    public dialog: MatDialog,
    private toastr: ToastrService,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Manage tags page title|:Manage tags`);
  }

  ngAfterViewInit(): void {
    const firstPage = new PageEvent();
    firstPage.pageSize = 10;
    firstPage.pageIndex = 0;
    this.paging$.next(firstPage);
  }

  public pageChange(page: PageEvent) {
    this.paging$.next(page);
  }

  public filterChange(filters: string[]) {
    this.filters$.next(filters);
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
            this.deleted$.next([tag._id]);
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
      this.created$.next([newTag]);
      this.newTagText = '';
      this.newTagColor = new Color(0, 0, 0);
      this.dialog.closeAll();
    } catch (err) {
      this.toastr.error(
        $localize`:Error while submitting tag|There was a server error while submitting the new tag:Error while submitting tag`
      );
    }
  }

  private filterSecret(secret: Tag, filters: string[]) {
    const parts = [secret?.text, secret.color];
    return filters.some((filter) => this.normalizeString(parts.join(' ')).includes(filter));
  }

  private normalizeString(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  openNewTagDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }
}
