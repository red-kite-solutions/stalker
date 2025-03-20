import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, firstValueFrom, map, switchMap, tap } from 'rxjs';
import { Md5 } from 'ts-md5';
import { ProjectsService } from '../../../api/projects/projects.service';
import { HttpStatus } from '../../../shared/types/http-status.type';
import { Project } from '../../../shared/types/project/project.interface';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/widget/confirm-dialog/confirm-dialog.component';
import { setGlobalProjectFilter } from '../../../utils/global-project-filter';

@Component({
  selector: 'app-edit-projects',
  templateUrl: './edit-projects.component.html',
  styleUrls: ['./edit-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProjectsComponent implements OnDestroy {
  form = this.fb.group({
    name: [
      '',
      {
        validators: [Validators.required],
      },
    ],
    notes: [''],
  });

  public fileSelected = false;
  public previewSource: string | undefined;
  public fileLoading = false;
  public valueChangeSubscriptions: Subscription[] = [];
  public triedSubmitFailed = false;
  public editLoading = false;
  public spinnerButtonText = $localize`:Save changes|Save the changes done to an item:Save Changes`;

  private md5Logo = '';

  public projectId$ = this.route.params.pipe(map((params) => params['id']));

  public project$ = this.projectId$.pipe(switchMap((id) => this.projectsService.get(id)));

  public routeSub$ = this.project$.pipe(
    tap(() => (this.fileLoading = true)),
    tap((project) => this.titleService.setTitle($localize`:Project page title|:Projects · ${project.name}`)),
    map((project: Project) => {
      this.form.controls['name'].setValue(project.name);
      this.form.controls['notes'].setValue(project.notes);

      this.fileLoading = false;
      if (project.logo) {
        this.previewSource = project.logo;
        const md5 = new Md5();
        md5.appendStr(project.logo);
        const logoMd5 = md5.end()?.toString();
        this.md5Logo = logoMd5 ? logoMd5 : '';
        this.fileSelected = true;
      }
    })
  );

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private projectsService: ProjectsService,
    private router: Router,
    private titleService: Title
  ) {}

  ngOnDestroy(): void {
    for (const s of this.valueChangeSubscriptions) {
      s.unsubscribe();
    }
  }

  async deleteProject() {
    const projectId = await firstValueFrom(this.projectId$);
    const data: ConfirmDialogData = {
      primaryButtonText: $localize`:Cancel|Cancel action:Cancel`,
      dangerButtonText: $localize`:Delete|Delete item:Delete`,
      title: $localize`:Deleting project|Deleting a project:Deleting project`,
      text: $localize`:Deleting comapny confirm|Confirmation text to delete a project:Do you really wish to delete this project ? All its associated data (hosts, domains, etc.), will be deleted.`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        await this.projectsService.delete(projectId);
        this.dialog.closeAll();
        this.toastr.success($localize`:Project deleted|Project deletion was a success:Project successfully deleted`);
        this.router.navigate(['/projects']);
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  async saveChanges() {
    if (this.editLoading) return;

    this.editLoading = true;
    const projectId = await firstValueFrom(this.projectId$);
    const projectUpdates: Partial<Project> = {};
    let formValid = this.form.controls['name'].valid;

    if (!formValid) {
      this.triedSubmitFailed = true;
      this.toastr.warning(
        $localize`:Correct form|User has to correct the errors in the form:Correct the form errors before submitting`
      );
      this.editLoading = false;
      return;
    }

    let imageType = '';
    let currentLogoHash = '';
    if (this.previewSource) {
      const md5 = new Md5();
      md5.appendStr(this.previewSource.toString());
      const logoMd5 = md5.end()?.toString();
      currentLogoHash = logoMd5 ? logoMd5 : '';
    }

    if (currentLogoHash !== this.md5Logo) {
      if (this.previewSource) {
        const split = (this.previewSource as string).split(',');
        projectUpdates.logo = split[1];
        imageType = split[0].split(';')[0].split(':')[1].split('/')[1];
      } else {
        projectUpdates.logo = '';
      }
    }

    projectUpdates.name = this.form.controls['name'].value;
    projectUpdates.notes = this.form.controls['notes'].value ? this.form.controls['notes'].value : '';
    try {
      const editData: any = {};
      if (imageType) editData['imageType'] = imageType;
      await this.projectsService.edit(projectId, { ...editData, ...projectUpdates });
      this.toastr.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);
    } catch (err: any) {
      if (err.status === HttpStatus.Conflict) {
        this.toastr.warning(
          $localize`:Project name unavailable|Conflict happenned when creating a project because another project already uses the provided name:Project with this name already exists`
        );
      } else if (err.status === HttpStatus.PayloadTooLarge) {
        this.toastr.warning(
          $localize`:Image too big|Error to send when the given image is too big:Image file is too big`
        );
      } else {
        throw err;
      }
    } finally {
      this.editLoading = false;
    }
  }

  public async setGlobalFilter() {
    const p = await firstValueFrom(this.project$);
    const gpf = { id: p._id, text: p.name };
    setGlobalProjectFilter(gpf);
  }
}
