import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { combineLatest, debounceTime, filter, map, merge, Subscription, switchMap } from 'rxjs';
import { CompaniesService } from 'src/app/api/companies/companies.service';
import { Company } from 'src/app/shared/types/company.interface';
import { HttpStatus } from 'src/app/shared/types/http-status.type';
import { Ipv4Subnet } from 'src/app/shared/types/ipv4-subnet';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { Md5 } from 'ts-md5/dist/md5';

@Component({
  selector: 'app-edit-companies',
  templateUrl: './edit-companies.component.html',
  styleUrls: ['./edit-companies.component.scss'],
})
export class EditCompaniesComponent implements OnDestroy {
  ipRanges = this.fb.array([
    this.fb.group({
      ip: ['', { validators: [this.ipValidator] }],
      maxIp: [{ value: '', disabled: true }],
      minIp: [{ value: '', disabled: true }],
      longMask: ['', { validators: [this.longMaskValidator] }],
      shortMask: ['', { validators: [this.shortMaskValidator] }],
      ipCount: [{ value: '', disabled: true }],
    }),
  ]);

  form = this.fb.group({
    name: [
      '',
      {
        validators: [Validators.required],
      },
    ],
    notes: [''],
    ipRanges: this.ipRanges,
    frequency: [0, []],
  });

  companyId = '';
  public fileSelected = false;
  public previewSource: string | undefined;
  public fileLoading = false;
  public valueChangeSubscriptions: Subscription[] = [];
  public triedSubmitFailed = false;
  public editLoading = false;
  public spinnerButtonText = $localize`:Save changes|Save the changes done to an item:Save Changes`;

  private md5Logo = '';

  private generateSubnetFormGroup(ipv4Subnet: Ipv4Subnet) {
    return this.fb.group({
      ip: [ipv4Subnet.ip, { validators: [this.ipValidator] }],
      maxIp: [{ value: ipv4Subnet.maxIp, disabled: true }],
      minIp: [{ value: ipv4Subnet.minIp, disabled: true }],
      longMask: [ipv4Subnet.longMask, { validators: [this.longMaskValidator] }],
      shortMask: [ipv4Subnet.shortMask, { validators: [this.shortMaskValidator] }],
      ipCount: [{ value: ipv4Subnet.ipCount, disabled: true }],
    });
  }

  private generateSubnetSubscription(subnetControl: AbstractControl, line: number) {
    const ip$ = subnetControl.get('ip')?.valueChanges.pipe(
      debounceTime(200),
      map((a: string) => {
        this.triedSubmitFailed = false;
        return a ? a.trim() : '';
      }),
      filter((x) => {
        return x === '' || Ipv4Subnet.isValidIp(x);
      }),
      map((a) => {
        return { ip: a, line: line };
      })
    );
    const shortMask$ = subnetControl.get('shortMask')?.valueChanges.pipe(
      debounceTime(200),
      map((a: string) => {
        this.triedSubmitFailed = false;
        return a ? a.trim() : '';
      }),
      filter((x: string) => {
        return x === '' || Ipv4Subnet.isValidShortMask(x);
      })
    );

    const longMask$ = subnetControl.get('longMask')?.valueChanges.pipe(
      debounceTime(200),
      map((a: string) => {
        this.triedSubmitFailed = false;
        return a ? a.trim() : '';
      }),
      filter((x: string) => {
        return x === '' || Ipv4Subnet.isValidLongMask(x);
      })
    );

    if (ip$ && shortMask$ && longMask$) {
      const mask$ = merge(shortMask$, longMask$);

      return combineLatest([ip$, mask$])
        .pipe(
          map(([$a, $b]) => {
            if (!$a.ip || !$b) {
              if ($a.ip) {
                return {
                  subnet: { ip: $a.ip, minIp: '', maxIp: '', ipCount: '', shortMask: '', longMask: '' },
                  line: $a.line,
                };
              }
              if ($b) {
                const masks = Ipv4Subnet.createMask($b);
                return {
                  subnet: {
                    ip: '',
                    minIp: '',
                    maxIp: '',
                    ipCount: '',
                    shortMask: masks.shortMask,
                    longMask: masks.longMask,
                  },
                  line: $a.line,
                };
              }
              return {
                subnet: { ip: '', minIp: '', maxIp: '', ipCount: '', shortMask: '', longMask: '' },
                line: $a.line,
              };
            }
            return { subnet: new Ipv4Subnet($a.ip, $b), line: $a.line };
          })
        )
        .subscribe((subnetData) => {
          const fa = this.form.controls['ipRanges'] as FormArray;
          fa.controls[subnetData.line].get('minIp')?.setValue(subnetData.subnet.minIp);
          fa.controls[subnetData.line].get('maxIp')?.setValue(subnetData.subnet.maxIp);
          fa.controls[subnetData.line].get('ipCount')?.setValue(subnetData.subnet.ipCount);
          fa.controls[subnetData.line].get('shortMask')?.setValue(subnetData.subnet.shortMask, { emitEvent: false });
          fa.controls[subnetData.line].get('longMask')?.setValue(subnetData.subnet.longMask, { emitEvent: false });
        });
    }

    return null;
  }

  public routeSub$ = this.route.params
    .pipe(
      switchMap((params) => {
        this.fileLoading = true;
        this.companyId = params['id'];
        return this.companiesService.get(this.companyId);
      })
    )
    .pipe(
      map((company: Company) => {
        this.form.controls['name'].setValue(company.name);
        this.form.controls['notes'].setValue(company.notes);
        const ranges = [];

        for (const range of company.ipRanges) {
          const rangeSplit = range.split('/');
          ranges.push(new Ipv4Subnet(rangeSplit[0], '/' + rangeSplit[1]));
        }

        const control = this.form.get('ipRanges') as FormArray;

        const subnetForm$ = this.generateSubnetSubscription(control.controls[0], 0);
        if (subnetForm$) {
          this.valueChangeSubscriptions.push(subnetForm$);
        }

        ranges.forEach((x) => {
          const group = this.generateSubnetFormGroup(x);
          control.push(group);
          const current = control.controls.length - 1;
          const subnet$ = this.generateSubnetSubscription(control.controls[current], current);
          if (subnet$) {
            this.valueChangeSubscriptions.push(subnet$);
          }

          group.controls['ip'].setValue(x.ip);
          group.controls['shortMask'].setValue(x.shortMask);
        });

        this.form.controls['frequency'].setValue(company.dataRefreshFrequency);

        this.fileLoading = false;
        if (company.logo) {
          this.previewSource = company.logo;
          const md5 = new Md5();
          md5.appendStr(company.logo);
          this.md5Logo = md5.end().toString();
          this.fileSelected = true;
        }
      })
    );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private companiesService: CompaniesService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    for (const s of this.valueChangeSubscriptions) {
      s.unsubscribe();
    }
  }

  public addSubnet() {
    const ipRanges = this.form.controls['ipRanges'] as FormArray;
    const newSubnetForm = ipRanges.controls[0];
    if (!newSubnetForm.valid) {
      return;
    }
    const subnet = new Ipv4Subnet(newSubnetForm.get('ip')?.value, newSubnetForm.get('shortMask')?.value);
    const newSubnetGroup = this.generateSubnetFormGroup(subnet);

    ipRanges.push(newSubnetGroup);
    const current = ipRanges.controls.length - 1;
    const subnet$ = this.generateSubnetSubscription(ipRanges.controls[current], current);
    if (subnet$) {
      this.valueChangeSubscriptions.push(subnet$);
    }
    newSubnetGroup.controls['ip'].setValue(newSubnetForm.get('ip')?.value);
    newSubnetGroup.controls['shortMask'].setValue(newSubnetForm.get('shortMask')?.value);

    newSubnetForm.reset();
  }

  ipValidator(ip: FormControl) {
    return Ipv4Subnet.isValidIp(ip.value) ? null : { error: 'Ip is not valid' };
  }

  shortMaskValidator(shortMask: FormControl) {
    return Ipv4Subnet.isValidShortMask(shortMask.value) ? null : { error: 'Mask is not valid' };
  }

  longMaskValidator(longMask: FormControl) {
    return Ipv4Subnet.isValidLongMask(longMask.value) ? null : { error: 'Mask is not valid' };
  }

  deleteSubnet($event: Event, line: number) {
    $event.stopPropagation();
    const fa = this.form.controls['ipRanges'] as FormArray;
    const subnet = fa.controls[line].get('ip')?.value + fa.controls[line].get('shortMask')?.value;
    const list = [subnet];

    const data: ConfirmDialogData = {
      primaryButtonText: $localize`:Cancel|Cancel action:Cancel`,
      dangerButtonText: $localize`:Delete|Delete item:Delete`,
      title: $localize`:Deleting subnet|Deleting a company subnet:Deleting subnet`,
      text: $localize`:Deleting subnet confirm|Confirmation text to delete a subnet:Do you really wish to delete the following subnet ?`,
      listElements: list,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: () => {
        fa.removeAt(line);
        this.dialog.closeAll();
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  deleteCompany() {
    const data: ConfirmDialogData = {
      primaryButtonText: $localize`:Cancel|Cancel action:Cancel`,
      dangerButtonText: $localize`:Delete|Delete item:Delete`,
      title: $localize`:Deleting company|Deleting a company:Deleting company`,
      text: $localize`:Deleting comapny confirm|Confirmation text to delete a company:Do you really wish to delete this company ? All its associated data (hosts, domains, etc.), will be deleted.`,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
      onDangerButtonClick: async () => {
        await this.companiesService.delete(this.companyId);
        this.dialog.closeAll();
        this.toastr.success($localize`:Company deleted|Company deletion was a success:Company successfully deleted`);
        this.router.navigate(['/companies']);
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
    const companyUpdates: Partial<Company> = {};
    let formValid = this.form.controls['name'].valid;
    const fa = this.form.controls['ipRanges'] as FormArray;
    companyUpdates.ipRanges = [];
    for (let i = 1; i < fa.length; ++i) {
      formValid = formValid && fa.controls[i].valid;
      const ip = fa.controls[i].get('ip')?.value;
      const sm = fa.controls[i].get('shortMask')?.value;
      if (ip && sm) {
        companyUpdates.ipRanges.push(ip + sm);
      }
    }

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
      currentLogoHash = md5.end().toString();
    }

    if (currentLogoHash !== this.md5Logo) {
      if (this.previewSource) {
        const split = (this.previewSource as string).split(',');
        companyUpdates.logo = split[1];
        imageType = split[0].split(';')[0].split(':')[1].split('/')[1];
      } else {
        companyUpdates.logo = '';
      }
    }

    companyUpdates.name = this.form.controls['name'].value;
    companyUpdates.notes = this.form.controls['notes'].value ? this.form.controls['notes'].value : '';
    try {
      const editData: any = {};
      if (imageType) editData['imageType'] = imageType;
      await this.companiesService.edit(this.companyId, { ...editData, ...companyUpdates });
      this.toastr.success($localize`:Changes saved|Changes to item saved successfully:Changes saved successfully`);
    } catch (err: any) {
      if (err.status === HttpStatus.Conflict) {
        this.toastr.warning(
          $localize`:Company name unavailable|Conflict happenned when creating a company because another company already uses the provided name:Company with this name already exists`
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
}
