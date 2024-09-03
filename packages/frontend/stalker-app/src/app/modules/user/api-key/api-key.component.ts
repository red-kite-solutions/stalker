import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { ApiKeyService } from '../../../api/auth/api-key/api-key.service';
import { SharedModule } from '../../../shared/shared.module';
import { ApiKey } from '../../../shared/types/api-key.type';
import { Page } from '../../../shared/types/page.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/widget/confirm-dialog/confirm-dialog.component';
import {
  ElementMenuItems,
  FilteredPaginatedTableComponent,
} from '../../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import { TableFormatComponent } from '../../../shared/widget/filtered-paginated-table/table-format/table-format.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FilteredPaginatedTableComponent,
    TableFormatComponent,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTableModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    SharedModule,
  ],
  selector: 'app-api-key',
  templateUrl: './api-key.component.html',
  styleUrls: ['./api-key.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyComponent {
  @Input()
  public userId: string | undefined = undefined;

  public readonly noDataMessage = $localize`:No api key found|No api key was found:No API key found`;
  public displayColumns = ['name', 'expiresAt', 'createdAt', 'menu'];
  public dataLoading: boolean = true;
  public count = 0;
  public selection = new SelectionModel<ApiKey>(true, []);
  public currentPage: PageEvent = this.generateFirstPageEvent();
  public currentPage$ = new BehaviorSubject<PageEvent>(this.currentPage);
  public newKeyValue: string | undefined = undefined;

  public form = this.fb.group({
    name: new FormControl<string>('', [Validators.required]),
    picker: new FormControl<Date | null>(null, [Validators.required]),
  });

  public dataSource$ = this.currentPage$.pipe(
    tap((currentPage) => {
      this.currentPage = currentPage;
    }),
    switchMap((currentPage) => {
      return this.apiKeyService.getPage(currentPage.pageIndex, currentPage.pageSize, this.userId);
    }),
    map((data: Page<ApiKey>) => {
      this.count = data.totalRecords;
      this.dataLoading = false;
      return new MatTableDataSource<ApiKey>(data.items);
    })
  );

  constructor(
    private fb: UntypedFormBuilder,
    private apiKeyService: ApiKeyService,
    private toastr: ToastrService,
    private dialog: MatDialog
  ) {}

  private generateFirstPageEvent(pageSize = 10) {
    const p = new PageEvent();
    p.pageIndex = 0;
    p.pageSize = pageSize;
    return p;
  }

  public deleteInteraction(apiKey: Pick<ApiKey, '_id' | 'name'>) {
    let data: ConfirmDialogData;

    data = {
      text: $localize`:Confirm delete api key|Confirmation message asking if the user really wants to delete the selected api key:Do you really wish to delete this key permanently ?`,
      title: $localize`:Deleting API key|Title of a page to delete selected api key:Deleting API key`,
      primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
      listElements: [apiKey.name],
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async (close) => {
        try {
          await this.apiKeyService.delete(apiKey._id);
          this.toastr.success($localize`:Key deleted|Key deleted:Key deleted successfully`);
        } catch {
          this.toastr.error($localize`:Server error|The server responded with an error:Server error occured`);
        }
        close(true);
      },
    };

    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          restoreFocus: false,
        })
        .afterClosed()
    );
  }

  public async delete(apiKey: Pick<ApiKey, '_id' | 'name'>) {
    const result = await this.deleteInteraction(apiKey);
    if (result) {
      this.currentPage$.next(this.currentPage);
    }
  }

  public generateMenuItem = (element: ApiKey): ElementMenuItems[] => {
    if (!element) return [];
    const menuItems: ElementMenuItems[] = [];

    menuItems.push({
      action: async () => this.delete(element),
      icon: 'delete',
      label: $localize`:Delete|Delete item:Delete`,
    });

    return menuItems;
  };

  pageChange(event: PageEvent) {
    this.dataLoading = true;
    this.currentPage$.next(event);
  }

  async createApiKey() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    const name: string = this.form.controls['name'].value;
    const date: Date = new Date(this.form.controls['picker'].value);

    try {
      const apiKey = await this.apiKeyService.createKey(name, date.getTime());
      this.newKeyValue = apiKey.key;
      this.toastr.success($localize`:Key created|Key created:Key created successfully`);
      this.pageChange(this.currentPage);
    } catch (err) {
      this.toastr.error($localize`:Server error|The server responded with an error:Server error occured`);
    }
  }
}
