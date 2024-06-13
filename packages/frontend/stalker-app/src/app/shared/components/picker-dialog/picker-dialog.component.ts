import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { BehaviorSubject, Observable, combineLatest, map, merge, mergeMap } from 'rxjs';
import { ThemeService } from '../../../services/theme.service';
import { CodeEditorComponent, CodeEditorTheme } from '../../widget/code-editor/code-editor.component';
import { ExtendedPickerData, PickerOption, PickerOptionPreviewCode } from './picker-dialog.type';

export interface PickerData {
  title: string;
  text?: string;
  selectButtonText?: string;
  pickerOptions?: PickerOption[];
  pickerOptionsProvider?: () => Observable<PickerOption[]>;
  enableCancelButton?: boolean;
  onSelection: ((option: PickerOption) => unknown) | ((option: PickerOption) => Promise<unknown>);
  extendedData: ExtendedPickerData; // Add other types of previews here
  continueWithoutTemplateEnabled?: boolean;
  continueWithoutTemplate?: (() => unknown) | (() => Promise<unknown>);
}

@Component({
  selector: 'picker-dialog',
  templateUrl: './picker-dialog.component.html',
  styleUrls: ['./picker-dialog.component.scss'],
})
export class PickerDialogComponent {
  @ViewChild(CodeEditorComponent) codeEditor!: CodeEditorComponent;
  public selectLoading = false;
  public previewLoading = false;
  public selectButtonText = $localize`:Select|Select:Select`;
  public selectedOption: PickerOption | null = null;
  treeControl = new NestedTreeControl<PickerOption>((node) => node.options);
  dataSource = new MatTreeNestedDataSource<PickerOption>();
  public filterChange$ = new BehaviorSubject<string>('');

  public optionsSubject$ = new BehaviorSubject<PickerOption[]>([]);
  public optionsObsSubject$ = new BehaviorSubject<Observable<PickerOption[]>>(new Observable<PickerOption[]>());
  public optionsObs$ = this.optionsObsSubject$.pipe(mergeMap((v) => v));
  public options$: Observable<PickerOption[]> = merge(this.optionsSubject$, this.optionsObs$);
  public dataSource$: Observable<PickerOption[]> = combineLatest([this.filterChange$, this.options$]).pipe(
    map(([filter, data]) => {
      const d = this.filterRecursive(filter, data, 'name');
      this.dataSource.data = d;
      this.treeControl.dataNodes = d;
      if (this.filterChange$.value) {
        this.treeControl.expandAll();
      } else {
        this.treeControl.collapseAll();
      }
      return d;
    })
  );

  public theme$: Observable<CodeEditorTheme> = this.themeService.theme$.pipe(
    map((theme) => (theme === 'dark' ? 'vs-dark' : 'vs'))
  );

  // Filter recursively on a text string using property object value
  // https://stackblitz.com/edit/angular-material-tree-filter?file=src%2Fapp%2Ftree-flat-overview-example.ts
  filterRecursive(filterText: string, options: PickerOption[], property: string): PickerOption[] {
    let filteredData;

    function copy(o: any) {
      return Object.assign({}, o);
    }

    if (filterText) {
      filterText = filterText.toLowerCase();
      filteredData = options.map(copy).filter(function x(opt) {
        if (opt[property].toLowerCase().includes(filterText)) {
          return true;
        }
        if (opt.options) {
          return (opt.options = opt.options.map(copy).filter(x)).length;
        }
      });
    } else {
      filteredData = options;
    }

    return filteredData;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PickerData,
    public dialog: MatDialog,
    private themeService: ThemeService
  ) {
    if (data.selectButtonText) this.selectButtonText = data.selectButtonText;

    if ((!data.pickerOptions && !data.pickerOptionsProvider) || (data.pickerOptions && data.pickerOptionsProvider))
      throw new Error('Template options or a template options provider must be given, and only one of the two');

    if (data.pickerOptions) {
      this.optionsSubject$.next(data.pickerOptions);
    } else {
      this.optionsObsSubject$.next(data.pickerOptionsProvider!());
    }
  }

  public cancel() {
    this.dialog.closeAll();
  }

  hasChild = (_: number, node: PickerOption) => !!node.options && node.options.length > 0;

  async selectPreview(node: PickerOption) {
    if (node.id === this.selectedOption?.id) return;

    this.selectedOption = node;
    this.previewLoading = true;

    try {
      let preview = await this.data.extendedData.onPreviewSelection(node);

      switch (this.data.extendedData.type) {
        case 'code':
          const codePreview = preview as PickerOptionPreviewCode;
          this.codeEditor.resetEditorFileTabs(codePreview.tabs);
          break;
      }
    } finally {
      this.previewLoading = false;
    }
  }

  async selectOption() {
    if (!this.selectedOption) return;

    this.selectLoading = true;
    try {
      await this.data.onSelection(this.selectedOption);
    } finally {
      this.selectLoading = false;
    }
  }

  async continueWithoutTemplate() {
    if (!this.data.continueWithoutTemplate) return;
    await this.data.continueWithoutTemplate();
  }
}
