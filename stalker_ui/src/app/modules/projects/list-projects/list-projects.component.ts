import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { map } from 'rxjs';
import { ProjectsService } from 'src/app/api/projects/projects.service';
import { ProjectAvatarComponent } from 'src/app/shared/components/project-avatar/project-avatar.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { HttpStatus } from 'src/app/shared/types/http-status.type';
import { Project } from 'src/app/shared/types/project/project.interface';

@Component({
  standalone: true,
  selector: 'app-list-projects',
  templateUrl: './list-projects.component.html',
  styleUrls: ['./list-projects.component.scss'],
  imports: [
    CommonModule,
    MatGridListModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    SharedModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ProjectAvatarComponent,
  ],
})
export class ListProjectsComponent implements OnDestroy {
  public createLabel = $localize`:Create|Create item:Create`;

  public projects: any[] | undefined;
  public projects$ = this.projectsService.getAll().subscribe((data) => {
    this.projects = data;
  });

  public addProjectClicked = true;

  private screenSize$ = this.bpObserver.observe([
    Breakpoints.XSmall,
    Breakpoints.Small,
    Breakpoints.Large,
    Breakpoints.XLarge,
  ]);

  public columns$ = this.screenSize$.pipe(
    map((screen: BreakpointState) => {
      if (screen.breakpoints[Breakpoints.XSmall]) return 1;
      else if (screen.breakpoints[Breakpoints.Small]) return 2;
      else if (screen.breakpoints[Breakpoints.Medium]) return 3;
      return 4;
    })
  );

  public displayNotes$ = this.screenSize$.pipe(
    map(
      (screen: BreakpointState) =>
        screen.breakpoints[Breakpoints.XLarge] ||
        screen.breakpoints[Breakpoints.Large] ||
        screen.breakpoints[Breakpoints.Small] ||
        screen.breakpoints[Breakpoints.XSmall]
    )
  );

  public titleFlex$ = this.displayNotes$.pipe(
    map((displayNotes: boolean) => {
      return displayNotes ? 34 : 100;
    })
  );

  public projectNameControl = new UntypedFormControl('', [Validators.required]);

  public fileSelected = false;
  public previewSource: string | undefined;
  public creationLoading = false;

  constructor(
    private bpObserver: BreakpointObserver,
    private projectsService: ProjectsService,
    private toastrService: ToastrService,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Projects list page title|:Projects`);
  }

  ngOnDestroy(): void {
    this.projects$.unsubscribe();
  }

  public async createProject() {
    if (this.creationLoading) return;

    this.creationLoading = true;
    let image: string | null = null;
    let imageType: string | null = null;
    if (!this.projectNameControl.valid) {
      this.projectNameControl.markAsTouched();
      this.creationLoading = false;
      return;
    }

    if (this.previewSource) {
      const split = (this.previewSource as string).split(',');
      image = split[1];
      imageType = split[0].split(';')[0].split(':')[1].split('/')[1];
    }
    try {
      const res: Project = await this.projectsService.create(this.projectNameControl.value, image, imageType);
      this.projects?.push(res);
      this.toastrService.success(
        $localize`:Project created|The new project was successfully created:Project created successfully`
      );

      this.fileSelected = false;
      this.previewSource = '';
      this.projectNameControl.setValue('');
      this.projectNameControl.setErrors(null);
    } catch (err: any) {
      if (err.status === HttpStatus.Conflict) {
        this.toastrService.warning(
          $localize`:Project name unavailable|Conflict happenned when creating a project because another project already uses the provided name:Project with this name already exists`
        );
      } else if (err.status === HttpStatus.PayloadTooLarge) {
        this.toastrService.warning(
          $localize`:Image too big|Error to send when the given image is too big:Image file is too big`
        );
      } else {
        throw err;
      }
    } finally {
      this.creationLoading = false;
    }
  }
}
