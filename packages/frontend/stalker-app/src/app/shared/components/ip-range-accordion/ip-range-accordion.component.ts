import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormArray,
  UntypedFormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { combineLatest, debounceTime, filter, map, merge, startWith, Subscription, tap } from 'rxjs';
import { SharedModule } from '../../shared.module';
import { IpRange } from '../../types/ip-range/ip-range.interface';
import { Ipv4Subnet } from '../../types/ipv4-subnet';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatIconModule,
    FormsModule,
    SharedModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
  ],
  selector: 'ip-range-accordion',
  templateUrl: 'ip-range-accordion.component.html',
  styles: `
    .error-bang {
      margin-right: 10px;
    }
    mat-panel-title {
      label {
        cursor: pointer;
      }
    }

    mat-panel-description {
      margin-right: 0px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpRangeAccordionComponent implements OnDestroy {
  @Input() inErrorState: boolean = false;
  private _ipRanges: Pick<IpRange, 'ip' | 'mask'>[] = [];
  @Input() set ipRanges(ranges: Pick<IpRange, 'ip' | 'mask'>[]) {
    this._ipRanges = ranges;
    this.clearSubscriptions();
    this._ipRangesForm.controls = this._ipRangesForm.controls.slice(0, 1);

    for (const range of ranges) {
      const subnet = new Ipv4Subnet(range.ip, range.mask.toString());
      const newSubnetGroup = this.generateSubnetFormGroup(subnet);

      this._ipRangesForm.push(newSubnetGroup, { emitEvent: false });
    }

    for (let i = 0; i < this._ipRangesForm.controls.length; ++i) {
      let subnetForm$ = this.generateSubnetObservable(this._ipRangesForm.controls[i], i);
      if (subnetForm$) {
        if (i > 0) {
          subnetForm$ = subnetForm$.pipe(
            tap((subnetData) => {
              this._ipRanges[subnetData.line - 1].ip = subnetData.subnet.ip;
              this._ipRanges[subnetData.line - 1].mask = Number(subnetData.subnet.shortMask);
            })
          );
        }
        const subscription$ = subnetForm$.subscribe((subnetData) => {
          const fa = this.form.controls['ipRanges'] as UntypedFormArray;
          fa.controls[subnetData.line].get('minIp')?.setValue(subnetData.subnet.minIp);
          fa.controls[subnetData.line].get('maxIp')?.setValue(subnetData.subnet.maxIp);
          fa.controls[subnetData.line].get('ipCount')?.setValue(subnetData.subnet.ipCount);
          fa.controls[subnetData.line].get('shortMask')?.setValue(subnetData.subnet.shortMask, { emitEvent: false });
          fa.controls[subnetData.line].get('longMask')?.setValue(subnetData.subnet.longMask, { emitEvent: false });
        });
        this.valueChangeSubscriptions.push(subscription$);
      }
    }
  }
  @Output() ipRangesChange = new EventEmitter<Pick<IpRange, 'ip' | 'mask'>[]>();

  public valueChangeSubscriptions: Subscription[] = [];

  _ipRangesForm = this.fb.array([this.generateAddSubnetForm()]);

  form = this.fb.group({
    ipRanges: this._ipRangesForm,
  });

  constructor(private fb: FormBuilder) {}

  private generateAddSubnetForm() {
    return this.fb.group({
      ip: ['', { validators: [this.ipValidator] }],
      maxIp: [{ value: '', disabled: true }],
      minIp: [{ value: '', disabled: true }],
      longMask: ['', { validators: [this.longMaskValidator] }],
      shortMask: ['', { validators: [this.shortMaskValidator] }],
      ipCount: [{ value: '', disabled: true }],
    });
  }

  private generateSubnetFormGroup(ipv4Subnet: Ipv4Subnet) {
    return this.fb.group({
      ip: [ipv4Subnet.ip, { validators: [this.ipValidator] }],
      maxIp: [{ value: ipv4Subnet.maxIp, disabled: true }],
      minIp: [{ value: ipv4Subnet.minIp, disabled: true }],
      longMask: [ipv4Subnet.longMask, { validators: [this.longMaskValidator] }],
      shortMask: [ipv4Subnet.shortMask, { validators: [this.shortMaskValidator] }],
      ipCount: [{ value: ipv4Subnet.ipCount.toString(), disabled: true }],
    });
  }

  ipValidator(ip: UntypedFormControl) {
    return Ipv4Subnet.isValidIp(ip.value) ? null : { error: 'Ip is not valid' };
  }

  shortMaskValidator(shortMask: UntypedFormControl) {
    return Ipv4Subnet.isValidShortMask(shortMask.value) ? null : { error: 'Mask is not valid' };
  }

  longMaskValidator(longMask: UntypedFormControl) {
    return Ipv4Subnet.isValidLongMask(longMask.value) ? null : { error: 'Mask is not valid' };
  }

  formValueToIpRange(formGroup: FormGroup): Pick<IpRange, 'ip' | 'mask'> {
    const ip = formGroup.get('ip')?.value ?? '';
    const mask = formGroup.get('shortMask')?.value ?? '';
    return { ip: ip.toString(), mask: Number(mask.toString()) };
  }

  updateSubnets(includeNew: boolean = true) {
    const ipRanges = this.form.controls['ipRanges'];

    const currentRanges: Pick<IpRange, 'ip' | 'mask'>[] = [];

    for (let i = 0; i < ipRanges.length; ++i) {
      if (i === 0 && !includeNew) continue;
      if (!ipRanges.controls[i].valid) return;
      currentRanges.push(this.formValueToIpRange(ipRanges.controls[i]));
    }

    this.ipRangesChange.next(currentRanges);

    if (includeNew) {
      ipRanges.controls[0].reset();
    }
  }

  removeSubnet(index: number) {
    this._ipRanges.splice(index - 1, 1);
    this._ipRangesForm.controls.splice(index, 1);
  }

  private generateSubnetObservable(subnetControl: AbstractControl, line: number) {
    const ip$ = subnetControl.get('ip')?.valueChanges.pipe(
      startWith(this._ipRangesForm.controls[line].value?.ip ?? ''),
      debounceTime(200),
      map((a: string) => {
        this.inErrorState = false;
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
      startWith(this._ipRangesForm.controls[line].value?.shortMask ?? ''),
      debounceTime(200),
      map((a: string) => {
        this.inErrorState = false;
        return a ? a.trim() : '';
      }),
      filter((x: string) => {
        return x === '' || Ipv4Subnet.isValidShortMask(x);
      })
    );

    const longMask$ = subnetControl.get('longMask')?.valueChanges.pipe(
      startWith(this._ipRangesForm.controls[line].value?.longMask ?? ''),
      debounceTime(200),
      map((a: string) => {
        this.inErrorState = false;
        return a ? a.trim() : '';
      }),
      filter((x: string) => {
        return x === '' || Ipv4Subnet.isValidLongMask(x);
      })
    );

    if (ip$ && shortMask$ && longMask$) {
      const mask$ = merge(shortMask$, longMask$);

      return combineLatest([ip$, mask$]).pipe(
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
      );
    }

    return null;
  }

  clearSubscriptions() {
    for (const s of this.valueChangeSubscriptions) {
      s.unsubscribe();
    }
    this.valueChangeSubscriptions = [];
  }

  ngOnDestroy(): void {
    this.clearSubscriptions();
  }
}
