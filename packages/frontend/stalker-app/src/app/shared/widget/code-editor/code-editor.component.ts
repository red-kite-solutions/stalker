import {
  AfterContentInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, first } from 'rxjs';
import { CodeEditorService } from './code-editor.service';
import { FileTab } from './code-editor.type';
import { MonacoModel } from './monaco.type';

declare const monaco: any;
export type CodeEditorTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

// https://stackoverflow.com/questions/71072724/implement-monaco-editor-in-angular-13
// https://github.com/atularen/ngx-monaco-editor
// https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html
@Component({
  standalone: true,
  imports: [MatIconModule],
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent implements AfterContentInit, OnDestroy {
  private readonly loggingEnabled = false;
  public _editor: any; // https://microsoft.github.io/monaco-editor/docs.html#interfaces/editor.ICodeEditor.html
  @ViewChild('editorContainer', { static: true }) _editorContainer!: ElementRef;

  private _code: string = '';
  private _theme!: string;
  private _minimapEnabled = true;
  private _language!: string;
  private _readonly = false;
  private _tabSize = 2;
  private _divResizeObserver: ResizeObserver | undefined;
  private _fileTabs: (MonacoModel & any)[] = [];
  private tabIdPathMapping: Map<string, string> = new Map<string, string>();
  private pathTabIdMapping: Map<string, string> = new Map<string, string>();
  public _currentFileTabIndex: number = 0;
  public onInitFinished$: Subject<boolean> = new Subject<boolean>();

  private loadSub: Subscription | undefined;
  private initSub: Subscription | undefined;

  @Input()
  public fileTabsEnabled: boolean = false;

  @Input()
  public fileTabsReadOnly: boolean = false;

  @Input()
  public path!: string;

  @Input()
  public tabId: string = '';

  @Input()
  public set code(val: string | null | undefined) {
    if (val === this._code) return;
    if (!val) val = '';

    this._code = val;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor.setValue(val);
    }
  }

  @Output()
  public codeChange = new EventEmitter<string>();

  @Input()
  public set language(val: string) {
    this._language = val;
    if (this.codeEditorService.loaded && this._editor) {
      // This is a confusing design choice, setModelLanguage is a module function instead of a model function
      monaco.editor.setModelLanguage(this._editor.getModel(), val);
    }
  }

  @Input()
  public set minimapEnabled(val: boolean) {
    this._minimapEnabled = val;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor.updateOptions({ minimap: { enabled: val } });
    }
  }

  @Input()
  public set theme(val: CodeEditorTheme) {
    this._theme = `${val}-stalker`;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor._themeService.setTheme(this._theme);
    }
  }

  @Input()
  public set readonly(val: boolean) {
    this._readonly = val;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor.updateOptions({ readOnly: val });
    }
  }

  @Input()
  public set tabSize(ts: number) {
    this._tabSize = ts;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor.getModel().updateOptions({ tabSize: ts });
    }
  }

  @Output()
  public saveEvent = new EventEmitter();

  public get fileTabs() {
    return this._fileTabs;
  }

  constructor(private codeEditorService: CodeEditorService) {}

  private propagateChange(value: string) {
    this._code = value;
    this.codeChange.emit(this._code);
  }

  private initMonaco(): void {
    if (!this.codeEditorService.loaded) {
      this.loadSub = this.codeEditorService.loadingFinished.pipe(first()).subscribe(() => {
        this.initMonaco();
      });

      return;
    }

    try {
      // Doc: https://microsoft.github.io/monaco-editor/monarch.html
      monaco.languages.register({ id: 'stalker-logs' });
      monaco.languages.setMonarchTokensProvider('stalker-logs', {
        tokenizer: {
          root: [
            [/^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}\]/, 'keyword.timestamp', '@level'],

            // String
            [/".*?"/, 'string.quote'],

            // Numbers
            [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
            [/0[xX][0-9a-fA-F]+/, 'number.hex'],
            [/\d+/, 'number'],
          ],
          level: [
            [
              /\[(debug)\] .*/,
              { token: 'keyword.debug', next: '@pop', log: this.loggingEnabled ? 'Found debug in "$0"' : undefined },
            ],
            [
              /\[(info)\]/,
              { token: 'keyword.info', next: '@pop', log: this.loggingEnabled ? 'Found info in "$0"' : undefined },
            ],
            [
              /\[(warning)\]/,
              {
                token: 'keyword.warning',
                next: '@pop',
                log: this.loggingEnabled ? 'Found warning in "$0"' : undefined,
              },
            ],
            [
              /\[(error)\]/,
              { token: 'keyword.error', next: '@pop', log: this.loggingEnabled ? 'Found error in "$0"' : undefined },
            ],
          ],
        },
      });

      const darkThemeRules: any[] = [
        { token: 'keyword.timestamp.stalker-logs', foreground: '#959595' },
        { token: 'keyword.debug.stalker-logs', foreground: '#867993' },
        { token: 'keyword.info.stalker-logs', foreground: '#61c5ff' },
        { token: 'keyword.warning.stalker-logs', foreground: '#ffd100' },
        { token: 'keyword.error.stalker-logs', foreground: '#ff6161' },
      ];

      const lightThemeRules: any[] = [
        { token: 'keyword.timestamp.stalker-logs', foreground: '#bbbbbb' },
        { token: 'keyword.debug.stalker-logs', foreground: '#b6aac1' },
        { token: 'keyword.info.stalker-logs', foreground: '#61c5ff' },
        { token: 'keyword.warning.stalker-logs', foreground: '#dbb300' },
        { token: 'keyword.error.stalker-logs', foreground: '#f51010' },
      ];

      monaco.editor.defineTheme('vs-stalker', {
        base: 'vs',
        inherit: true,
        rules: lightThemeRules,
        colors: {
          'topbar.background': '#F4F4F4',
          'topbar.background1': '#FBFBFB',
          'topbar.background2': '#CECECE',
          'topbar.foreground': '#3F3F3F',
          'topbar.foreground1': '#595959',
          'topbar.accent': '#3d7eff',
          'topbar.divider': '#BABABA',
          'topbar.divider1': '#A8A8A8',
        },
      });

      monaco.editor.defineTheme('vs-dark-stalker', {
        base: 'vs-dark',
        inherit: true,
        rules: darkThemeRules,
        colors: {
          'topbar.background': '#1e1e1e',
          'topbar.background1': '#303030',
          'topbar.background2': '#545454',
          'topbar.foreground': '#d4d4d4',
          'topbar.foreground1': '#b5b5b5',
          'topbar.accent': '#3d7eff',
          'topbar.divider': '#a1a1a1',
          'topbar.divider1': '#717171',
        },
      });

      monaco.editor.defineTheme('hc-light-stalker', {
        base: 'hc-light',
        inherit: true,
        rules: lightThemeRules,
        colors: {},
      });

      monaco.editor.defineTheme('hc-black-stalker', {
        base: 'hc-black',
        inherit: true,
        rules: darkThemeRules,
        colors: {},
      });
    } catch (err) {
      console.log(err);
    }

    const options = {
      minimap: {
        enabled: this._minimapEnabled,
      },
      theme: this._theme,
      readOnly: this._readonly,
      tabSize: this._tabSize,
      automaticLayout: true,
    };

    const firstModel = monaco.editor.createModel(this._code, this._language, monaco.Uri.file(this.path));
    this._editor = monaco.editor.create(this._editorContainer.nativeElement, options);
    this._editor.setModel(firstModel);

    this._editor.onDidChangeModelContent(() => {
      const code = this._editor.getValue();

      this.propagateChange(code);
    });

    this._fileTabs.push(firstModel);
    this.tabIdPathMapping.set(this.tabId, this.path);
    this.pathTabIdMapping.set(this.path, this.tabId);

    const containerElement = document.querySelector('.editor-container');
    this._divResizeObserver = new ResizeObserver(() => {
      this._editor.layout();
    });

    if (containerElement) this._divResizeObserver.observe(containerElement);

    this.onInitFinished$.next(true);
  }

  ngAfterContentInit(): void {
    this.initMonaco();
  }

  ngOnDestroy(): void {
    if (this.loadSub) this.loadSub.unsubscribe();
    if (this.onInitFinished$) this.onInitFinished$.unsubscribe();
    if (this.initSub) this.initSub.unsubscribe();

    this.deleteAllFileTabs();

    if (this._editor) {
      this._editor.dispose();
      this._editor = undefined;
    }
    this._divResizeObserver?.disconnect();
  }

  public onKeyDown(event: any) {
    if (event.ctrlKey && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      this.saveEvent.emit();
    }
  }

  public getColor(colorName: string) {
    let color = this._editor._themeService._theme.themeData.colors[colorName];
    if (!color) color = this._editor._themeService._theme.colors.get(colorName);
    if (!color) color = this._editor._themeService._theme.defaultColors[colorName];
    return color;
  }

  public getFileName(path: string) {
    return path.split('/').pop();
  }

  public createFileTab(fileTab: FileTab, focusWhenDone: boolean = true) {
    this._fileTabs.push(monaco.editor.createModel(fileTab.content, fileTab.language, monaco.Uri.file(fileTab.uri)));
    this.tabIdPathMapping.set(fileTab.id, fileTab.uri);
    this.pathTabIdMapping.set(fileTab.uri, fileTab.id);
    if (focusWhenDone) this.selectFileTab(this._fileTabs.length - 1);
  }

  public createFileTabs(fileTabs: FileTab[], focusWhenDone: boolean = true) {
    for (const tab of fileTabs) this.createFileTab(tab, false);
    if (focusWhenDone) this.selectFileTab(this._fileTabs.length - 1);
  }

  public selectFileTab(index: number) {
    if (index < 0 || index >= this._fileTabs.length) return;

    const state = this._editor.saveViewState();
    this._fileTabs[this._currentFileTabIndex].state = state;
    this._currentFileTabIndex = index;
    this._editor.setModel(this._fileTabs[index]);
    this._editor.restoreViewState(this._fileTabs[index].state);
    this._editor.focus();
  }

  public deleteFileTab(index: number) {
    if (index < 0 || index >= this._fileTabs.length) return;
    if (!this._editor) return;

    const uri = this._fileTabs[index].uri.path;
    const tabId = this.pathTabIdMapping.get(uri);
    this.pathTabIdMapping.delete(uri);
    this.tabIdPathMapping.delete(tabId!);

    // changing the current tab index if the tab that we will delete is the currently selected tab
    if (
      (index === this._currentFileTabIndex && index === this._fileTabs.length - 1) ||
      index < this._currentFileTabIndex
    ) {
      this._currentFileTabIndex--;
    }

    const deleted = this._fileTabs.splice(index, 1);

    // reselect before full delete, but only if there is a tab left
    if (this._fileTabs.length > 0) {
      this._editor.setModel(this._fileTabs[this._currentFileTabIndex]);
      this._editor.restoreViewState(this._fileTabs[this._currentFileTabIndex].state);
      this._editor.focus();
    } else {
      this._editor.setModel(null);
    }

    deleted[0].dispose();
  }

  public deleteAllFileTabs() {
    if (!this.fileTabs || !this._editor) return;

    const tabs = this._fileTabs;
    this._fileTabs = [];
    this._currentFileTabIndex = -1;
    for (const tab of tabs) {
      if (tab) tab.dispose();
    }
    this._editor.setModel(null);
    this.tabIdPathMapping.clear();
    this.pathTabIdMapping.clear();
  }

  public resetEditorFileTabs(fileTabs: FileTab[], fileTabFocusIndex: number = 0) {
    if (!this.codeEditorService.loaded || !this._editor) {
      this.initSub = this.onInitFinished$.subscribe((initialised) => {
        if (initialised) {
          this.resetEditorFileTabs(fileTabs, fileTabFocusIndex);
        }
      });
      return;
    }

    if (new Set(fileTabs.map((x) => x.id)).size != fileTabs.length) {
      throw new Error('Duplicate tab identifiers found.');
    }

    this.deleteAllFileTabs();
    for (const tab of fileTabs) {
      const newModel = monaco.editor.createModel(tab.content, tab.language, monaco.Uri.file(tab.uri));
      this._fileTabs.push(newModel);
      this.tabIdPathMapping.set(tab.id, tab.uri);
      this.pathTabIdMapping.set(tab.uri, tab.id);
    }
    this._currentFileTabIndex = fileTabFocusIndex;
    this._code = fileTabs[fileTabFocusIndex].content;
    this._language = fileTabs[fileTabFocusIndex].language;
    this.path = fileTabs[fileTabFocusIndex].uri;
    this._editor.setModel(this._fileTabs[this._currentFileTabIndex]);
  }

  public getAllFileTabs(): FileTab[] {
    const tabs: FileTab[] = [];
    for (const tab of this._fileTabs) {
      tabs.push({
        content: tab.getValue(),
        language: tab.getLanguageId(),
        uri: tab.uri,
        id: this.pathTabIdMapping.get(tab.uri) ?? '',
      });
    }
    return tabs;
  }

  public getFileTabByPath(uri: string): FileTab | undefined {
    const tab = this._fileTabs.find((tab) => uri === tab.uri.path);
    if (!tab) return undefined;
    const id = this.pathTabIdMapping.get(uri);
    if (!id) return undefined;
    return {
      content: tab.getValue(),
      language: tab.getLanguageId(),
      uri: tab.uri,
      id: id,
    };
  }

  public getFileTabById(id: string): FileTab | undefined {
    const uri = this.tabIdPathMapping.get(id);
    if (!uri) return undefined;
    const tab = this._fileTabs.find((tab) => uri === tab.uri.path);
    if (!tab) return undefined;
    return {
      content: tab.getValue(),
      language: tab.getLanguageId(),
      uri: tab.uri,
      id: id,
    };
  }

  public setFileTabContentById(id: string, content: string) {
    const uri = this.tabIdPathMapping.get(id);
    if (!uri) return;
    const tab = this._fileTabs.find((tab) => uri === tab.uri.path);
    if (!tab) return;
    tab.setValue(content);
  }
}
