import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { PortsService } from 'src/app/api/ports/ports.service';
import { Port } from 'src/app/shared/types/ports/port.interface';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class PortsInteractionsService {
  constructor(
    private portsService: PortsService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public deleteBatch(ports: Pick<Port, '_id' | 'port' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (ports.length > 0) {
      data = {
        text: $localize`:Confirm delete ports|Confirmation message asking if the user really wants to delete the selected ports:Do you really wish to delete these ports permanently ?`,
        title: $localize`:Deleting ports|Title of a page to delete selected ports:Deleting ports`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: this.toBulletPoints(ports, projects),
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async (close) => {
          const ids = ports.map((d) => d._id);
          await this.portsService.deleteMany(ids);
          this.toastr.success(
            $localize`:Ports deleted|Confirm the successful deletion of a Port:Ports deleted successfully`
          );
          close(true);
        },
      };
    } else {
      data = {
        text: $localize`:Select ports again|No ports were selected so there is nothing to delete:Select the ports to delete and try again.`,
        title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
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

  public async blockBatch(ports: Pick<Port, '_id' | 'port' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (ports.length > 0) {
      const block = async (close: (result: boolean) => void, block: boolean) => {
        try {
          await this.portsService.block(
            ports.map((s) => s._id),
            block
          );
          this.toastr.success(
            block
              ? $localize`:Ports blocked|Blocked a port:Ports blocked successfully`
              : $localize`:Ports unblocked|Unblocked a port:Ports unblocked successfully`
          );
          close(true);
        } catch {
          this.toastr.error($localize`:Error blocking|Error while blocking a port:Error blocking ports`);
          close(false);
        }
      };

      data = {
        text: $localize`:Confirm block ports|Confirmation message asking if the user wants to block the selected ports:Do you wish to block or unblock these ports?`,
        title: $localize`:Blocking ports|Title of a page to block selected ports:Blocking ports`,
        primaryButtonText: $localize`:Unblock|Unblock an item:Unblock`,
        dangerButtonText: $localize`:Block|Block an item:Block`,
        listElements: this.toBulletPoints(ports, projects),
        enableCancelButton: true,
        onPrimaryButtonClick: async (close) => await block(close, false),
        onDangerButtonClick: async (close) => await block(close, true),
      };
    } else {
      data = {
        text: $localize`:Select ports again|No ports were selected so there is nothing to delete:Select the ports to block and try again.`,
        title: $localize`:Nothing to block|Tried to block something, but there was nothing to delete:Nothing to block`,
        primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
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

  public block(portId: string, block: boolean) {
    const errorBlocking = $localize`:Error while blocking|Error while blocking an item:Error while blocking`;
    if (!portId) {
      this.toastr.error(errorBlocking);
    }

    let data: ConfirmDialogData = {
      text: block
        ? $localize`:Confirm block port|Confirmation message asking if the user wants to block the port:Do you really wish to block this port?`
        : $localize`:Confirm unblock port|Confirmation message asking if the user wants to unblock the port:Do you really wish to unblock this port?`,
      title: block
        ? $localize`:Blocking port|Title of a page to block a port:Blocking port`
        : $localize`:Unblocking port|Title of a page to unblock a port:Unblocking port`,
      primaryButtonText: block ? $localize`:Block|Block an item:Block` : $localize`:Unblock|Unblock an item:Unblock`,
      enableCancelButton: true,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.portsService.block([portId], block);
          this.toastr.success(
            block
              ? $localize`:Port blocked|Blocked a port:Port blocked successfully`
              : $localize`:Port unblocked|Unblocked a port:Port unblocked successfully`
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

  private toBulletPoints(ports: Pick<Port, '_id' | 'port' | 'projectId'>[], projects?: ProjectSummary[]) {
    return ports.map((x) => {
      const projectName = projects?.find((d) => d.id === x.projectId)?.name;
      return projectName ? `${x.port} (${projectName})` : `${x.port}`;
    });
  }
}
