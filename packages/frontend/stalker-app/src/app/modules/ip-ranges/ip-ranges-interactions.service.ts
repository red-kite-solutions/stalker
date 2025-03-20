import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { IpRangesService } from '../../api/ip-ranges/ip-ranges.service';
import { IpRange } from '../../shared/types/ip-range/ip-range.interface';
import { ProjectSummary } from '../../shared/types/project/project.summary';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../shared/widget/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class IpRangesInteractionsService {
  constructor(
    private ipRangesService: IpRangesService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public deleteBatch(ipRanges: Pick<IpRange, '_id' | 'ip' | 'mask' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (ipRanges.length > 0) {
      data = {
        text: $localize`:Confirm delete IP ranges|Confirmation message asking if the user really wants to delete the selected IP ranges:Do you really wish to delete these IP ranges permanently ?`,
        title: $localize`:Deleting IP ranges|Title of a page to delete selected IP ranges:Deleting IP ranges`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: this.toBulletPoints(ipRanges, projects),
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async (close) => {
          const ids = ipRanges.map((d) => d._id);
          await this.ipRangesService.deleteMany(ids);
          this.toastr.success(
            $localize`:IP ranges deleted|Confirm the successful deletion of an IP ranges:IP ranges deleted successfully`
          );
          close(true);
        },
      };
    } else {
      data = {
        text: $localize`:Select IP ranges again|No IP ranges were selected so there is nothing to delete:Select the IP ranges to delete and try again.`,
        title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
        noDataSelectItem: true,
        onPrimaryButtonClick: (close) => {
          close(false);
        },
      };
    }

    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          restoreFocus: false,
        })
        .afterClosed()
    );
  }

  public async blockBatch(ipRanges: Pick<IpRange, '_id' | 'ip' | 'mask' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (ipRanges.length > 0) {
      const block = async (close: (result: boolean) => void, block: boolean) => {
        try {
          await this.ipRangesService.block(
            ipRanges.map((s) => s._id),
            block
          );
          this.toastr.success(
            block
              ? $localize`:IP ranges blocked|Blocked an IP range:IP ranges successfully blocked`
              : $localize`:IP ranges unblocked|Unblocked an IP range:IP ranges successfully unblocked`
          );
          close(true);
        } catch {
          this.toastr.error($localize`:Error blocking|Error while blocking an IP range:Error blocking IP ranges`);
          close(false);
        }
      };

      data = {
        text: $localize`:Confirm block IP ranges|Confirmation message asking if the user wants to block the selected IP ranges:Do you wish to block or unblock these IP ranges?`,
        title: $localize`:Blocking IP ranges|Title of a page to block selected IP ranges:Blocking IP ranges`,
        primaryButtonText: $localize`:Unblock|Unblock an item:Unblock`,
        dangerButtonText: $localize`:Block|Block an item:Block`,
        listElements: this.toBulletPoints(ipRanges, projects),
        enableCancelButton: true,
        onPrimaryButtonClick: async (close) => await block(close, false),
        onDangerButtonClick: async (close) => await block(close, true),
      };
    } else {
      data = {
        text: $localize`:Select IP ranges again|No IP ranges were selected so there is nothing to delete:Select the IP ranges to block and try again.`,
        title: $localize`:Nothing to block|Tried to block something, but there was nothing to delete:Nothing to block`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
        noDataSelectItem: true,
        onPrimaryButtonClick: (close) => close(false),
      };
    }

    return firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data,
          restoreFocus: false,
        })
        .afterClosed()
    );
  }

  public block(ipRangeId: string, block: boolean) {
    const errorBlocking = $localize`:Error while blocking|Error while blocking an item:Error while blocking`;
    if (!ipRangeId) {
      this.toastr.error(errorBlocking);
    }

    let data: ConfirmDialogData = {
      text: block
        ? $localize`:Confirm block IP range|Confirmation message asking if the user wants to block the IP range:Do you really wish to block this IP range?`
        : $localize`:Confirm unblock IP range|Confirmation message asking if the user wants to unblock the IP range:Do you really wish to unblock this IP range?`,
      title: block
        ? $localize`:Blocking IP range|Title of a page to block a IP range:Blocking IP range`
        : $localize`:Unblocking IP range|Title of a page to unblock a IP range:Unblocking IP range`,
      primaryButtonText: block ? $localize`:Block|Block an item:Block` : $localize`:Unblock|Unblock an item:Unblock`,
      enableCancelButton: true,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.ipRangesService.block([ipRangeId], block);
          this.toastr.success(
            block
              ? $localize`:IP range blocked|Blocked an IP range:IP range successfully blocked`
              : $localize`:IP range unblocked|Unblocked an IP range:IP range successfully unblocked`
          );

          close(true);
        } catch {
          this.toastr.error(errorBlocking);
          close(false);
        }
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

  private toBulletPoints(ipRanges: Pick<IpRange, '_id' | 'ip' | 'mask' | 'projectId'>[], projects?: ProjectSummary[]) {
    return ipRanges.map((x) => {
      const projectName = projects?.find((d) => d.id === x.projectId)?.name;
      return projectName ? `${x.ip}/${x.mask} (${projectName})` : `${x.ip}/${x.mask}`;
    });
  }
}
