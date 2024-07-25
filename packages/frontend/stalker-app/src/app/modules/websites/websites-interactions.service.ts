import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { ProjectSummary } from 'src/app/shared/types/project/project.summary';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { WebsitesService } from '../../api/websites/websites.service';
import { Website } from '../../shared/types/websites/website.type';
import {
  MergeWebsitesData,
  MergeWebsitesDialogComponent,
} from './list-websites/merge-websites/merge-websites.component';

@Injectable({ providedIn: 'root' })
export class WebsiteInteractionsService {
  constructor(
    private websitesService: WebsitesService,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  public deleteBatch(websites: Pick<Website, '_id' | 'url' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (websites.length > 0) {
      data = {
        text: $localize`:Confirm delete websites|Confirmation message asking if the user really wants to delete the selected websites:Do you really wish to delete these websites permanently ?`,
        title: $localize`:Deleting websites|Title of a page to delete selected websites:Deleting websites`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: this.toBulletPoints(websites, projects),
        onPrimaryButtonClick: () => {
          this.dialog.closeAll();
        },
        onDangerButtonClick: async (close) => {
          const ids = websites.map((d) => d._id);
          await this.websitesService.deleteMany(ids);
          this.toastr.success(
            $localize`:Websites deleted|Confirm the successful deletion of a website:Websites deleted successfully`
          );
          close(true);
        },
      };
    } else {
      data = {
        text: $localize`:Select websites again|No websites were selected so there is nothing to delete:Select the websites to delete and try again.`,
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

  public async blockBatch(websites: Pick<Website, '_id' | 'url' | 'projectId'>[], projects?: ProjectSummary[]) {
    let data: ConfirmDialogData;
    if (websites.length > 0) {
      const block = async (close: (result: boolean) => void, block: boolean) => {
        try {
          await this.websitesService.block(
            websites.map((s) => s._id),
            block
          );
          this.toastr.success(
            block
              ? $localize`:Websites blocked|Blocked a website:Websites successfully blocked`
              : $localize`:Websites unblocked|Unblocked a website:Websites successfully unblocked`
          );
          close(true);
        } catch {
          this.toastr.error($localize`:Error blocking|Error while blocking a website:Error blocking websites`);
          close(false);
        }
      };

      data = {
        text: $localize`:Confirm block websites|Confirmation message asking if the user wants to block the selected websites:Do you wish to block or unblock these websites?`,
        title: $localize`:Blocking websites|Title of a page to block selected websites:Blocking websites`,
        primaryButtonText: $localize`:Unblock|Unblock an item:Unblock`,
        dangerButtonText: $localize`:Block|Block an item:Block`,
        listElements: this.toBulletPoints(websites, projects),
        enableCancelButton: true,
        onPrimaryButtonClick: async (close) => await block(close, false),
        onDangerButtonClick: async (close) => await block(close, true),
      };
    } else {
      data = {
        text: $localize`:Select websites again|No websites were selected so there is nothing to delete:Select the websites to block and try again.`,
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

  public block(websiteId: string, block: boolean) {
    const errorBlocking = $localize`:Error while blocking|Error while blocking an item:Error while blocking`;
    if (!websiteId) {
      this.toastr.error(errorBlocking);
    }

    let data: ConfirmDialogData = {
      text: block
        ? $localize`:Confirm block website|Confirmation message asking if the user wants to block the website:Do you really wish to block this website?`
        : $localize`:Confirm unblock website|Confirmation message asking if the user wants to unblock the website:Do you really wish to unblock this website?`,
      title: block
        ? $localize`:Blocking website|Title of a page to block a website:Blocking website`
        : $localize`:Unblocking website|Title of a page to unblock a website:Unblocking website`,
      primaryButtonText: block ? $localize`:Block|Block an item:Block` : $localize`:Unblock|Unblock an item:Unblock`,
      enableCancelButton: true,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.websitesService.block([websiteId], block);
          this.toastr.success(
            block
              ? $localize`:Website blocked|Blocked a website:Website successfully blocked`
              : $localize`:Website unblocked|Unblocked a website:Website successfully unblocked`
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

  private toBulletPoints(websites: Pick<Website, '_id' | 'url' | 'projectId'>[], projects?: ProjectSummary[]) {
    return websites.map((x) => {
      const projectName = projects?.find((d) => d.id === x.projectId)?.name;
      return projectName ? `${x.url} (${projectName})` : `${x.url}`;
    });
  }

  public async merge(websites: Website[], projects: ProjectSummary[]) {
    const data: MergeWebsitesData = {
      selectedWebsites: websites,
      projects: projects,
    };
    let mergeSuccess = false;

    try {
      mergeSuccess = !!(await firstValueFrom(
        this.dialog
          .open(MergeWebsitesDialogComponent, {
            data,
            restoreFocus: false,
          })
          .afterClosed()
      ));

      if (mergeSuccess) {
        this.toastr.success($localize`:Website merged|Merged a website:Website successfully merged`);
      }
    } catch {
      this.toastr.error($localize`:Error while merging|Error while merging an item:Error while merging`);
    }

    return mergeSuccess;
  }

  public async unmerge(websiteId: string) {
    const errorBlocking = $localize`:Error while unmerging|Error while unmerging an item:Error while unmerging`;
    if (!websiteId) {
      this.toastr.error(errorBlocking);
    }

    let data: ConfirmDialogData = {
      text: $localize`:Confirm unmerge website|Confirmation message asking if the user wants to unmerge the website:Do you really wish to unmerge this website?`,
      title: $localize`:Unmerging website|Title of a page to unmerge a website:Unmerging website`,
      primaryButtonText: $localize`:Unmerge|Unmerge an item:Unmerge`,
      enableCancelButton: true,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.websitesService.unmerge([websiteId]);
          this.toastr.success($localize`:Website unmerged|Unmerged a website:Website successfully unmerged`);
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
}
