import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { first, Subscription } from 'rxjs';
import { CodeEditorService } from './code-editor.service';

declare const monaco: any;
export type CodeEditorTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

// https://stackoverflow.com/questions/71072724/implement-monaco-editor-in-angular-13
// https://github.com/atularen/ngx-monaco-editor
// https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent implements AfterViewInit, OnDestroy {
  private readonly loggingEnabled = false;
  public _editor: any;
  @ViewChild('editorContainer', { static: true }) _editorContainer!: ElementRef;

  private _code: string | null = '';
  private _theme!: string;
  private _minimapEnabled = true;
  private _language!: string;
  private _readonly = false;
  private _tabSize = 2;
  private _divResizeObserver: ResizeObserver | undefined;

  private loadSub: Subscription | undefined;

  @Input()
  public set code(val: string | null) {
    if (val === this._code) return;

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
        colors: {},
      });

      monaco.editor.defineTheme('vs-dark-stalker', {
        base: 'vs-dark',
        inherit: true,
        rules: darkThemeRules,
        colors: {},
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
      value: this._code,
      language: this._language,
      minimap: {
        enabled: this._minimapEnabled,
      },
      theme: this._theme,
      readOnly: this._readonly,
      tabSize: this._tabSize,
    };

    this._editor = monaco.editor.create(this._editorContainer.nativeElement, options);

    this._editor.onDidChangeModelContent(() => {
      const code = this._editor.getValue();

      this.propagateChange(code);
    });

    const containerElement = document.querySelector('.editor-container');
    this._divResizeObserver = new ResizeObserver(() => {
      this._editor.layout();
    });

    if (containerElement) this._divResizeObserver.observe(containerElement);
  }

  ngAfterViewInit(): void {
    this.initMonaco();
  }

  ngOnDestroy(): void {
    if (this.loadSub) this.loadSub.unsubscribe();
    if (this._editor) {
      this._editor.dispose();
      this._editor = undefined;
    }
    this._divResizeObserver?.disconnect();
  }

  public onKeyDown(event: any) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.saveEvent.emit();
    }
  }
}
