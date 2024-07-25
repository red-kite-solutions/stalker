import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { HostsService } from 'src/app/api/hosts/hosts.service';
import { Host } from 'src/app/shared/types/host/host.interface';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class HostsInteractionsService {
  constructor(
    private hostsService: HostsService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public deleteBatch(hosts: Pick<Host, '_id' | 'ip' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (hosts.length > 0) {
      data = {
        text: $localize`:Confirm delete hosts|Confirmation message asking if the user really wants to delete the selected hosts:Do you really wish to delete these hosts permanently ?`,
        title: $localize`:Deleting hosts|Title of a page to delete selected hosts:Deleting hosts`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: this.toBulletPoints(hosts, projects),
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async (close) => {
          const ids = hosts.map((d) => d._id);
          await this.hostsService.deleteMany(ids);
          this.toastr.success(
            $localize`:Hosts deleted|Confirm the successful deletion of a Host:Hosts deleted successfully`
          );
          close(true);
        },
      };
    } else {
      data = {
        text: $localize`:Select hosts again|No hosts were selected so there is nothing to delete:Select the hosts to delete and try again.`,
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

  public async blockBatch(hosts: Pick<Host, '_id' | 'ip' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (hosts.length > 0) {
      const block = async (close: (result: boolean) => void, block: boolean) => {
        try {
          await this.hostsService.block(
            hosts.map((s) => s._id),
            block
          );
          this.toastr.success(
            block
              ? $localize`:Hosts blocked|Blocked a host:Hosts successfully blocked`
              : $localize`:Hosts unblocked|Unblocked a host:Hosts successfully unblocked`
          );
          close(true);
        } catch {
          this.toastr.error($localize`:Error blocking|Error while blocking a host:Error blocking hosts`);
          close(false);
        }
      };

      data = {
        text: $localize`:Confirm block hosts|Confirmation message asking if the user wants to block the selected hosts:Do you wish to block or unblock these hosts?`,
        title: $localize`:Blocking hosts|Title of a page to block selected hosts:Blocking hosts`,
        primaryButtonText: $localize`:Unblock|Unblock an item:Unblock`,
        dangerButtonText: $localize`:Block|Block an item:Block`,
        listElements: this.toBulletPoints(hosts, projects),
        enableCancelButton: true,
        onPrimaryButtonClick: async (close) => await block(close, false),
        onDangerButtonClick: async (close) => await block(close, true),
      };
    } else {
      data = {
        text: $localize`:Select hosts again|No hosts were selected so there is nothing to delete:Select the hosts to block and try again.`,
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

  public block(hostId: string, block: boolean) {
    const errorBlocking = $localize`:Error while blocking|Error while blocking an item:Error while blocking`;
    if (!hostId) {
      this.toastr.error(errorBlocking);
    }

    let data: ConfirmDialogData = {
      text: block
        ? $localize`:Confirm block host|Confirmation message asking if the user wants to block the host:Do you really wish to block this host?`
        : $localize`:Confirm unblock host|Confirmation message asking if the user wants to unblock the host:Do you really wish to unblock this host?`,
      title: block
        ? $localize`:Blocking host|Title of a page to block a host:Blocking host`
        : $localize`:Unblocking host|Title of a page to unblock a host:Unblocking host`,
      primaryButtonText: block ? $localize`:Block|Block an item:Block` : $localize`:Unblock|Unblock an item:Unblock`,
      enableCancelButton: true,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.hostsService.block([hostId], block);
          this.toastr.success(
            block
              ? $localize`:Host blocked|Blocked a host:Host successfully blocked`
              : $localize`:Host unblocked|Unblocked a host:Host successfully unblocked`
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

  private toBulletPoints(hosts: Pick<Host, '_id' | 'ip' | 'projectId'>[], projects?: ProjectSummary[]) {
    return hosts.map((x) => {
      const projectName = projects?.find((d) => d.id === x.projectId)?.name;
      return projectName ? `${x.ip} (${projectName})` : `${x.ip}`;
    });
  }
}
