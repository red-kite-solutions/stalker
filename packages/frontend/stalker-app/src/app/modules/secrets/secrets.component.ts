import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Component, Inject, TemplateRef } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, firstValueFrom, map, shareReplay, switchMap, tap } from 'rxjs';
import { ProjectsService } from '../../api/projects/projects.service';
import { SecretService } from '../../api/secrets/secrets.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ProjectCellComponent } from '../../shared/components/project-cell/project-cell.component';
import { SharedModule } from '../../shared/shared.module';
import { Secret } from '../../shared/types/secret.type';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/widget/confirm-dialog/confirm-dialog.component';
import { FilteredPaginatedTableComponent } from '../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
import {
  TableFiltersSource,
  TableFiltersSourceBase,
} from '../../shared/widget/filtered-paginated-table/table-filters-source';
import { TableFormatComponent } from '../../shared/widget/filtered-paginated-table/table-format/table-format.component';
import { secretExplanation } from './secrets.constants';

@Component({
  selector: 'app-secrets',
  standalone: true,
  templateUrl: './secrets.component.html',
  styleUrl: './secrets.component.scss',
  imports: [
    MatCardModule,
    CommonModule,
    MatIconModule,
    FilteredPaginatedTableComponent,
    AvatarComponent,
    ProjectCellComponent,
    SharedModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    ReactiveFormsModule,
    MatOptionModule,
    MatSelectModule,
    TableFormatComponent,
  ],
  providers: [{ provide: TableFiltersSourceBase, useClass: TableFiltersSource }],
})
export class SecretsComponent {
  public isLoading$ = new BehaviorSubject(true);

  public noDataMessage = $localize`:No secret found|No secret were found:No secret found`;
  public hideValue = true;
  public secretExplanation = secretExplanation;
  public allProjects = 'all projects';
  public selection = new SelectionModel<Secret>(true, []);

  public projects$ = this.projectsService.getAllSummaries().pipe(shareReplay(1));

  public newSecretForm = this.fb.group({
    project: new FormControl<string>(this.allProjects),
    name: new FormControl<string>('', [Validators.required, Validators.pattern(/^\s*[^\s\{\}]+\s*$/)]),
    value: new FormControl<string>('', Validators.required),
    description: new FormControl<string>(''),
  });

  private refresh$ = new BehaviorSubject(null);
  public secrets$ = combineLatest([this.filtersSource.debouncedFilters$, this.projects$, this.refresh$]).pipe(
    switchMap(([{ filters, pagination }, projects]) =>
      this.secretService.getSecrets(filters, pagination?.page ?? 0, pagination?.pageSize ?? 25, projects)
    ),

    shareReplay(1)
  );

  public dataSource$ = this.secrets$.pipe(
    map((secrets) => new MatTableDataSource<Secret>(secrets.items)),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private secretService: SecretService,
    private projectsService: ProjectsService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private titleService: Title,
    @Inject(TableFiltersSourceBase) private filtersSource: TableFiltersSource
  ) {
    this.titleService.setTitle($localize`:Secrets|:Secrets`);
  }

  async delete() {
    const projects = await firstValueFrom(this.projects$);
    const bulletPoints: string[] = Array<string>();
    for (const secret of this.selection.selected) {
      const projectName = projects!.find((p) => p.id === secret.projectId)?.name;
      const bp = projectName ? `${secret.name} (${projectName})` : secret.name;
      bulletPoints.push(bp);
    }

    let data: ConfirmDialogData;
    if (bulletPoints.length > 0) {
      data = {
        text: $localize`:Confirm delete secrets|Confirmation message asking if the user really wants to delete the selected secrets:Do you really wish to delete these secrets permanently?`,
        title: $localize`:Deleting secrets|Title of a page to delete selected secrets:Deleting secrets`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: bulletPoints,
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async () => {
          const ids = this.selection.selected.map((h: Secret) => {
            return h._id;
          });
          await firstValueFrom(this.secretService.deleteMany(ids));
          this.selection.clear();
          this.toastr.success(
            $localize`:Secrets deleted|Confirm the successful deletion of a Domain:Secrets deleted successfully`
          );
          this.refresh$.next(null);
          this.dialog.closeAll();
        },
      };
    } else {
      data = {
        text: $localize`:Select secrets again|No secrets were selected so there is nothing to delete:Select the secrets to delete and try again.`,
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

  async create() {
    if (!this.newSecretForm.valid) {
      this.newSecretForm.markAllAsTouched();
      return;
    }

    const project = this.newSecretForm.get('project')?.value ?? undefined;
    const secret = {
      name: this.newSecretForm.get('name')?.value ?? '',
      value: this.newSecretForm.get('value')?.value ?? '',
      description: this.newSecretForm.get('description')?.value ?? undefined,
      projectId: project === this.allProjects ? undefined : project,
    };
    try {
      await this.secretService.create(secret);
      this.newSecretForm.reset();
      this.dialog.closeAll();
      this.toastr.success(
        $localize`:Successfully created secret|Successfully created secret:Successfully created secret`
      );
      this.refresh$.next(null);
    } catch (err) {
      this.toastr.error($localize`:Error creating secret|Error creating secret:Error creating secret`);
    }
  }

  openNewSecretDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }
}
