import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, filter, map, startWith, tap } from 'rxjs';
import { WebsitesService } from '../../../../api/websites/websites.service';
import { SharedModule } from '../../../../shared/shared.module';
import { ProjectSummary } from '../../../../shared/types/project/project.summary';
import { Website } from '../../../../shared/types/websites/website.type';
import { NoDataSelectItemComponent } from '../../../../shared/widget/no-data-select-item/no-data-select-item.component';
import { SpinnerButtonComponent } from '../../../../shared/widget/spinner-button/spinner-button.component';

export interface MergeWebsitesData {
  selectedWebsites: Website[];
  projects: ProjectSummary[];
}

@Component({
  selector: 'app-merge-websites-dialog',
  templateUrl: './merge-websites.component.html',
  styleUrls: ['./merge-websites.component.scss'],
  standalone: true,
  imports: [
    SpinnerButtonComponent,
    MatDialogModule,
    MatStepperModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatStepperModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    NoDataSelectItemComponent,
    SharedModule,
    CommonModule,
    MatAutocompleteModule,
  ],
})
export class MergeWebsitesDialogComponent implements AfterViewInit {
  @ViewChild('stepper') stepper!: MatStepper;

  public validProjects: ProjectSummary[];
  selectProjectStep = this._formBuilder.group({
    project: ['', Validators.required],
  });

  private validOptions: Website[] = [];
  private validateTargetWebsite = (control: AbstractControl): ValidationErrors | null => {
    const forbidden = !this.validOptions.find((o) => o.url === control.value);
    return forbidden ? { forbiddenName: { value: control.value } } : null;
  };

  mergeDestinationStep = this._formBuilder.group({
    targetWebsite: new FormControl('', [Validators.required, this.validateTargetWebsite]),
  });

  public sortedWebsites: Website[];

  private project$ = this.selectProjectStep.get('project')!.valueChanges;
  public websitesToMerge: Website[] = [];
  public websitesToMerge$ = this.project$?.pipe(
    filter((p) => !!p),
    map((pid) => {
      return this.sortedWebsites.filter((w) => w.projectId === pid);
    }),
    tap((websites) => {
      this.websitesToMerge = websites;
      this.alreadyMergedUrls = [];
      for (const w of websites) {
        if (w.mergedInId) {
          this.alreadyMergedUrls.push({ id: w._id, url: w.url });
        }
      }
    })
  );

  public selectableWebsites$ = combineLatest([
    this.websitesToMerge$,
    this.mergeDestinationStep.get('targetWebsite')!.valueChanges.pipe(startWith('')),
  ]).pipe(
    map(([websites, filterValue]) => {
      return websites.filter((w) => {
        return !filterValue || w.url.includes(filterValue);
      });
    }),
    tap((w) => {
      this.validOptions = w;
    })
  );

  public mergeTarget: string | undefined = undefined;
  public mergeTarget$ = this.mergeDestinationStep.get('targetWebsite')!.valueChanges.pipe(
    filter((url) => !!url),
    map((url: string | null) => {
      return this.validOptions.find((w) => w.url === url);
    }),
    filter((w) => !!w),
    tap((w) => {
      this.mergeTarget = w!._id;
    })
  );

  public alreadyMergedUrls: { id: string; url: string }[] = [];
  public mergePreview$ = combineLatest([this.mergeTarget$, this.websitesToMerge$]).pipe(
    filter(([w, ws]) => !!w && !!ws),
    map(([website, websites]) => {
      if (!website) return undefined;

      const extendedWebsite: Website & {
        alternativeDomains: string[];
        alternativeHosts: string[];
        alternativePorts: string[];
      } = { ...website, alternativeDomains: [], alternativeHosts: [], alternativePorts: [] };
      const domains = new Set<string>();
      const hosts = new Set<string>();
      const ports = new Set<string>();

      for (let w of websites) {
        if (w.domain && w.domain.name !== website.domain?.name) domains.add(w.domain.name);
        if (w.host.ip !== website.host.ip) hosts.add(w.host.ip);
        if (w.port.port !== website.port.port) ports.add(w.port.port.toString());
      }

      extendedWebsite.alternativeDomains.push(...domains);
      extendedWebsite.alternativeHosts.push(...hosts);
      extendedWebsite.alternativePorts.push(...ports);

      return extendedWebsite;
    })
  );

  public mergeLoading = false;

  public async merge() {
    this.mergeLoading = true;

    const mergeFrom = this.websitesToMerge.map((w) => w._id).filter((id) => id !== this.mergeTarget);

    try {
      if (this.mergeTarget && mergeFrom && mergeFrom.length) {
        await this.websiteService.merge(this.mergeTarget, mergeFrom);
        this.dialog.close(true);
      }
    } catch {
    } finally {
      this.mergeLoading = false;
    }
  }

  public cancel() {
    this.dialog.close(false);
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MergeWebsitesData,
    public dialog: MatDialogRef<MergeWebsitesData, boolean>,
    private _formBuilder: FormBuilder,
    private ref: ChangeDetectorRef,
    private websiteService: WebsitesService,
    private toastr: ToastrService
  ) {
    this.validProjects = data.projects.filter((p) => data.selectedWebsites.find((w) => w.projectId === p.id));
    this.sortedWebsites = data.selectedWebsites.sort((a, b) => {
      const compA = a.domain?.name ? a.domain.name : a.host.ip;
      const compB = b.domain?.name ? b.domain.name : b.host.ip;
      return compA.localeCompare(compB);
    });
  }

  ngAfterViewInit(): void {
    if (this.data.selectedWebsites.length <= 0) {
      return;
    }

    const selectedProject = this.data.selectedWebsites[0].projectId;
    let allTheSameProject = true;

    for (let i = 1; i < this.data.selectedWebsites.length; ++i) {
      if (this.data.selectedWebsites[i].projectId !== selectedProject) {
        allTheSameProject = false;
        break;
      }
    }

    if (allTheSameProject) {
      this.selectProjectStep.get('project')?.setValue(selectedProject);
      this.stepper.selectedIndex = 1;
      this.ref.detectChanges();
    }
  }
}
