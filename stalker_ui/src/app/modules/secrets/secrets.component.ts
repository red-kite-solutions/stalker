import { CommonModule } from '@angular/common';
import { Component, TemplateRef } from '@angular/core';
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
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, combineLatest, debounceTime, map, scan, shareReplay, switchMap, tap } from 'rxjs';
import { ProjectsService } from '../../api/projects/projects.service';
import { SecretService } from '../../api/secrets/secrets.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ProjectCellComponent } from '../../shared/components/project-cell/project-cell.component';
import { SharedModule } from '../../shared/shared.module';
import { ProjectSummary } from '../../shared/types/project/project.summary';
import { Secret } from '../../shared/types/secret.type';
import { FilteredPaginatedTableComponent } from '../../shared/widget/filtered-paginated-table/filtered-paginated-table.component';
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
  ],
})
export class SecretsComponent {
  public isLoading$ = new BehaviorSubject(true);
  private filters$ = new BehaviorSubject<string[]>([]);
  private createSecret$ = new BehaviorSubject<Secret[]>([]);

  public noDataMessage = $localize`:No secret found|No secret were found:No secret found`;
  public hideValue = true;
  public secretExplanation = secretExplanation;
  public allProjects = 'all projects';

  public projects?: ProjectSummary[];
  public projects$ = this.projectsService.getAllSummaries().pipe(
    tap((projects) => {
      this.projects = projects;
    })
  );

  public newSecretForm = this.fb.group({
    project: new FormControl<string>(this.allProjects),
    name: new FormControl<string>('', Validators.required),
    value: new FormControl<string>('', Validators.required),
    description: new FormControl<string>(''),
  });

  private createdSecret$ = this.createSecret$.pipe(
    scan((newSecret, previousNewSecrets) => {
      return previousNewSecrets.concat(newSecret);
    })
  );

  public secrets$ = combineLatest([this.createdSecret$, this.secretService.getSecrets()]).pipe(
    map(([createdSecrets, dbSecrets]) => dbSecrets.concat(createdSecrets)),
    map((secrets) => secrets.sort((a, b) => a._id.localeCompare(b._id))),
    switchMap((secrets) =>
      this.filters$.pipe(
        debounceTime(250),
        map((filters) => filters.map((filter) => this.normalizeString(filter))),
        map((filters) => secrets.filter((sub) => !filters.length || this.filterSecret(sub, filters)))
      )
    ),
    shareReplay(1)
  );

  public dataSource$ = combineLatest([this.secrets$, this.projects$]).pipe(
    map(([secrets]) => new MatTableDataSource<Secret>(secrets)),
    tap(() => this.isLoading$.next(false)),
    shareReplay(1)
  );

  constructor(
    private secretService: SecretService,
    private projectsService: ProjectsService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {}

  delete() {}

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
      const newSecret = await this.secretService.create(secret);
      this.newSecretForm.reset();
      this.dialog.closeAll();
      this.createSecret$.next([newSecret]);
      this.toastr.success(
        $localize`Successfully created secret:Successfully created secret:Successfully created secret`
      );
    } catch (err) {
      this.toastr.error($localize`:Error creating secret|Error creating secret:Error creating secret`);
    }
  }

  public pageChange(e: any) {}

  public filterChange(filters: string[]) {
    this.filters$.next(filters);
  }

  private filterSecret(secret: Secret, filters: string[]) {
    const parts = [secret?.name, this.projects?.find((p) => p.id === secret._id)?.name, secret.description];
    return filters.some((filter) => this.normalizeString(parts.join(' ')).includes(filter));
  }

  private normalizeString(str: string) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  openNewSecretDialog(templateRef: TemplateRef<any>) {
    this.dialog.open(templateRef, {
      restoreFocus: false,
      minWidth: '50%',
    });
  }
}
