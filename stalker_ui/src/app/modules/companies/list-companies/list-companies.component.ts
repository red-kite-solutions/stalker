import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FlexModule, MediaChange, MediaObserver } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { CompanyAvatarComponent } from 'src/app/shared/components/company-avatar/company-avatar.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { Company } from 'src/app/shared/types/company/company.interface';
import { HttpStatus } from 'src/app/shared/types/http-status.type';

@Component({
  standalone: true,
  selector: 'app-list-companies',
  templateUrl: './list-companies.component.html',
  styleUrls: ['./list-companies.component.scss'],
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
    FlexModule,
    CompanyAvatarComponent,
  ],
})
export class ListCompaniesComponent implements OnDestroy {
  public createLabel = $localize`:Create|Create item:Create`;

  public companies: any[] | undefined;
  public companies$ = this.companiesService.getAll().subscribe((data) => {
    this.companies = data;
  });

  public addCompanyClicked = true;

  private screenSize$ = this.mediaObserver.asObservable().pipe(
    filter((mediaChanges: MediaChange[]) => !!mediaChanges[0].mqAlias),
    distinctUntilChanged((previous: MediaChange[], current: MediaChange[]) => {
      return previous[0].mqAlias === current[0].mqAlias;
    }),
    map((mediaChanges: MediaChange[]) => {
      return mediaChanges[0].mqAlias;
    })
  );

  public columns$ = this.screenSize$.pipe(
    map((screen: string) => {
      if (screen === 'xs') return 1;
      if (screen === 'sm') return 2;
      if (screen === 'md' || screen === 'lg') return 3;
      return 4;
    })
  );

  public displayNotes$ = this.screenSize$.pipe(
    map((screen: string) => {
      return screen === 'xl' || screen === 'lg' || screen === 'xs';
    })
  );

  public titleFlex$ = this.displayNotes$.pipe(
    map((displayNotes: boolean) => {
      return displayNotes ? 34 : 100;
    })
  );

  public companyNameControl = new UntypedFormControl('', [Validators.required]);

  public fileSelected = false;
  public previewSource: string | undefined;
  public creationLoading = false;

  constructor(
    private mediaObserver: MediaObserver,
    private companiesService: CompaniesService,
    private toastrService: ToastrService,
    private titleService: Title
  ) {
    this.titleService.setTitle($localize`:Companies list page title|:Companies`);
  }

  ngOnDestroy(): void {
    this.companies$.unsubscribe();
  }

  public async createCompany() {
    if (this.creationLoading) return;

    this.creationLoading = true;
    let image: string | null = null;
    let imageType: string | null = null;
    if (!this.companyNameControl.valid) {
      this.companyNameControl.markAsTouched();
      this.creationLoading = false;
      return;
    }

    if (this.previewSource) {
      const split = (this.previewSource as string).split(',');
      image = split[1];
      imageType = split[0].split(';')[0].split(':')[1].split('/')[1];
    }
    try {
      const res: Company = await this.companiesService.create(this.companyNameControl.value, image, imageType);
      this.companies?.push(res);
      this.toastrService.success(
        $localize`:Company created|The new company was successfully created:Company created successfully`
      );

      this.fileSelected = false;
      this.previewSource = '';
      this.companyNameControl.setValue('');
      this.companyNameControl.setErrors(null);
    } catch (err: any) {
      if (err.status === HttpStatus.Conflict) {
        this.toastrService.warning(
          $localize`:Company name unavailable|Conflict happenned when creating a company because another company already uses the provided name:Company with this name already exists`
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
