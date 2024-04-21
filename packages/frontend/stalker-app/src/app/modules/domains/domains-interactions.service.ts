import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { DomainsService } from 'src/app/api/domains/domains.service';
import { Domain } from 'src/app/shared/types/domain/domain.interface';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DomainsInteractionsService {
  constructor(
    private domainsService: DomainsService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public deleteBatch(domains: Pick<Domain, '_id' | 'name' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (domains.length > 0) {
      data = {
        text: $localize`:Confirm delete domains|Confirmation message asking if the user really wants to delete the selected domains:Do you really wish to delete these domains permanently ?`,
        title: $localize`:Deleting domains|Title of a page to delete selected domains:Deleting domains`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: this.toBulletPoints(domains, projects),
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async (close) => {
          const ids = domains.map((d) => d._id);
          await this.domainsService.deleteMany(ids);
          this.toastr.success(
            $localize`:Domains deleted|Confirm the successful deletion of a Domain:Domains deleted successfully`
          );
          close(true);
        },
      };
    } else {
      data = {
        text: $localize`:Select domains again|No domains were selected so there is nothing to delete:Select the domains to delete and try again.`,
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

  public async blockBatch(domains: Pick<Domain, '_id' | 'name' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (domains.length > 0) {
      const block = async (close: (result: boolean) => void, block: boolean) => {
        try {
          await this.domainsService.block(
            domains.map((s) => s._id),
            block
          );
          this.toastr.success(
            block
              ? $localize`:Domains blocked|Blocked a domain:Domains successfully blocked`
              : $localize`:Domains unblocked|Unblocked a domain:Domains successfully unblocked`
          );
          close(true);
        } catch {
          this.toastr.error($localize`:Error blocking|Error while blocking a domain:Error blocking domains`);
          close(false);
        }
      };

      data = {
        text: $localize`:Confirm block domains|Confirmation message asking if the user wants to block the selected domains:Do you wish to block or unblock these domains?`,
        title: $localize`:Blocking domains|Title of a page to block selected domains:Blocking domains`,
        primaryButtonText: $localize`:Unblock|Unblock an item:Unblock`,
        dangerButtonText: $localize`:Block|Block an item:Block`,
        listElements: this.toBulletPoints(domains, projects),
        enableCancelButton: true,
        onPrimaryButtonClick: async (close) => await block(close, false),
        onDangerButtonClick: async (close) => await block(close, true),
      };
    } else {
      data = {
        text: $localize`:Select domains again|No domains were selected so there is nothing to delete:Select the domains to block and try again.`,
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

  public block(domainId: string, block: boolean) {
    const errorBlocking = $localize`:Error while blocking|Error while blocking an item:Error while blocking`;
    if (!domainId) {
      this.toastr.error(errorBlocking);
    }

    let data: ConfirmDialogData = {
      text: block
        ? $localize`:Confirm block domain|Confirmation message asking if the user wants to block the domain:Do you really wish to block this domain?`
        : $localize`:Confirm unblock domain|Confirmation message asking if the user wants to unblock the domain:Do you really wish to unblock this domain?`,
      title: block
        ? $localize`:Blocking domain|Title of a page to block a domain:Blocking domain`
        : $localize`:Unblocking domain|Title of a page to unblock a domain:Unblocking domain`,
      primaryButtonText: block ? $localize`:Block|Block an item:Block` : $localize`:Unblock|Unblock an item:Unblock`,
      enableCancelButton: true,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.domainsService.block([domainId], block);
          this.toastr.success(
            block
              ? $localize`:Domain blocked|Blocked a domain:Domain successfully blocked`
              : $localize`:Domain unblocked|Unblocked a domain:Domain successfully unblocked`
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

  private toBulletPoints(domains: Pick<Domain, '_id' | 'name' | 'projectId'>[], projects?: ProjectSummary[]) {
    return domains.map((x) => {
      const projectName = projects?.find((d) => d.id === x.projectId)?.name;
      return projectName ? `${x.name} (${projectName})` : `${x.name}`;
    });
  }
}
