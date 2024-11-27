import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, firstValueFrom, map } from 'rxjs';
import { CustomJobsService } from 'src/app/api/jobs/custom-jobs/custom-jobs.service';
import { CustomJob } from 'src/app/shared/types/jobs/custom-job.type';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from 'src/app/shared/widget/confirm-dialog/confirm-dialog.component';
import { CustomJobTemplatesService } from '../../../api/jobs/custom-job-templates/custom-job-templates.service';
import { PickerData, PickerDialogComponent } from '../../../shared/components/picker-dialog/picker-dialog.component';
import { CodePickerData, PickerOption } from '../../../shared/components/picker-dialog/picker-dialog.type';
import { CustomJobTemplateSummary } from '../../../shared/types/jobs/custom-job-template.type';
import { FileTab } from '../../../shared/widget/code-editor/code-editor.type';

@Injectable({ providedIn: 'root' })
export class CustomJobsInteractionService {
  constructor(
    private customJobsService: CustomJobsService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    public router: Router,
    public templateService: CustomJobTemplatesService
  ) {}

  public async delete(jobs: Pick<CustomJob, '_id' | 'name'>[]): Promise<boolean> {
    let data: ConfirmDialogData = {
      text: $localize`:Select jobs again|No job was selected so there is nothing to delete:Select the jobs to delete and try again.`,
      title: $localize`:Nothing to delete|Tried to delete something, but there was nothing to delete:Nothing to delete`,
      primaryButtonText: $localize`:Ok|Accept or confirm:Ok`,
      noDataSelectItem: true,
      onPrimaryButtonClick: () => {
        this.dialog.closeAll();
      },
    };

    if (jobs.length > 0) {
      data = {
        text: $localize`:Confirm custom job deletion|Confirmation message asking if the user really wants to delete this job:Do you really wish to delete these jobs permanently ?`,
        title: $localize`:Deleting custom jobs|Title of a page to delete a custom job:Deleting custom jobs`,
        primaryButtonText: $localize`:Cancel|Cancel current action:Cancel`,
        dangerButtonText: $localize`:Delete permanently|Confirm that the user wants to delete the item permanently:Delete permanently`,
        listElements: jobs.map((x) => x.name),
        onPrimaryButtonClick: (close) => close(false),
        onDangerButtonClick: async (close) => {
          for (const job of jobs) {
            try {
              await this.customJobsService.delete(job._id);
            } catch {
              this.toastr.error($localize`:Error while deleting|Error while deleting:Error while deleting`);
              continue;
            }
          }

          this.toastr.success(
            $localize`:Successfully deleted custom job|Successfully deleted custom job:Successfully deleted custom job`
          );

          close(true);
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

  public async syncCache() {
    const data: ConfirmDialogData = {
      text: $localize`:Confirm orchestrator cache sync|Confirmation message asking if the user really wants to sync the orchestrator cache:Do you really wish to sync the Orchestrator's cache? It will send the jobs' latest version to the Orchestrator.`,
      title: $localize`:Syncing the orchestrator cache|Title of a page to sync the orchestrator's cache:Syncing the Orchestrator cache`,
      primaryButtonText: $localize`:Sync|Sync:Sync`,
      dangerButtonText: $localize`:Cancel|Cancel current action:Cancel`,
      onPrimaryButtonClick: async (close) => {
        try {
          await this.customJobsService.syncCache();
        } catch {
          this.toastr.error($localize`:Error while syncing|Error while syncing:Error while syncing`);
          return;
        }
        this.toastr.success($localize`:Cache synced|Cache synced:Cache synced`);
        close(true);
      },
      onDangerButtonClick: (close) => {
        close(false);
      },
    };

    this.dialog.open(ConfirmDialogComponent, {
      data,
      restoreFocus: false,
    });
  }

  public selectTemplate() {
    let data: PickerData = {
      title: $localize`:Job templates|Job templates:Job templates`,
      text: $localize`:Job template text|Job template picker text:Select a job template from the left panel to get started, or continue without a template.`,
      onSelection: async (option: PickerOption) => {
        this.router.navigateByUrl(`/jobs/custom/create?templateId=${option.id}`);
        this.dialog.closeAll();
      },
      pickerOptionsProvider: (): Observable<PickerOption[]> => {
        return this.templateService.getAllSummaries().pipe(
          map((templateSummaries: CustomJobTemplateSummary[]) => {
            const sortedTemplates = templateSummaries.sort((a, b) => {
              const aCategory = a.category ? a.category.toLowerCase() : '/';
              const bCategory = b.category ? b.category.toLowerCase() : '/';
              return aCategory.localeCompare(bCategory);
            });
            const optionsTree: PickerOption[] = [];

            let i = 0;
            const createOptions = (
              options: PickerOption[],
              parentFolders: string[] = [],
              currentFolder: string = '',
              depth: number = 0
            ) => {
              while (i < sortedTemplates.length) {
                let folders = sortedTemplates[i].category?.split('/') ?? [''];
                folders = folders.filter((s, j) => j === 0 || s.length);

                let arr: string[] = [];

                // our new leaf is less deep, return
                if (
                  depth + 1 > folders.length ||
                  folders.slice(0, depth + 1).join('/') !== arr.concat(parentFolders).concat(currentFolder).join('/')
                ) {
                  parentFolders.pop();
                  return;
                }

                // our new leaf is deeper, create folder and go deeper
                if (depth + 1 < folders.length) {
                  options.push({
                    id: '',
                    name: folders[depth + 1],
                    options: [],
                  });
                  parentFolders.push(currentFolder);
                  createOptions(options[options.length - 1].options!, parentFolders, folders[depth + 1], depth + 1);
                }

                // our new leaf is in the current folder, create and go to the next leaf
                if (depth + 1 === folders.length) {
                  options.push({
                    id: sortedTemplates[i]._id,
                    name: sortedTemplates[i].name,
                    options: undefined,
                  });
                  i++;
                }
              }
            };

            createOptions(optionsTree);

            for (let j = 0; j < optionsTree.length; ++j) {
              if (optionsTree[j].name === 'built-in') {
                optionsTree[j].lessImportant = true;
                optionsTree.push(optionsTree.splice(j, 1)[0]);
                break;
              }
            }

            return optionsTree;
          })
        );
      },
      extendedData: new CodePickerData(async (option: PickerOption) => {
        const template = await firstValueFrom(this.templateService.get(option.id));
        const tabs: FileTab[] = [
          {
            id: template._id,
            content: template.code,
            language: template.language,
            uri: `/custom-job-templates/${template.name}`,
          },
        ];

        return {
          id: option.id,
          tabs: tabs,
        };
      }),
      continueWithoutTemplate: () => {
        this.router.navigate(['/jobs/custom/create']);
        this.dialog.closeAll();
      },
    };

    this.dialog.open(PickerDialogComponent, {
      data,
      restoreFocus: false,
    });
  }
}
