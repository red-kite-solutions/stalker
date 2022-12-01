import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { debounceTime, first, fromEvent, Subscription } from 'rxjs';
import { CodeEditorService } from './code-editor.service';

declare const monaco: any;

// https://stackoverflow.com/questions/71072724/implement-monaco-editor-in-angular-13
// https://github.com/atularen/ngx-monaco-editor
// https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html
@Component({
  selector: 'app-code-editor',
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.scss'],
})
export class CodeEditorComponent implements AfterViewInit, OnDestroy {
  public _editor: any;
  @ViewChild('editorContainer', { static: true }) _editorContainer!: ElementRef;

  private _code = '';
  private _theme!: string;
  private _minimapEnabled = true;
  private _language!: string;
  private _readonly = false;
  private _tabSize = 2;
  private _windowResizeSubscription: Subscription | undefined;

  private loadSub: Subscription | undefined;

  @Input()
  public set code(val: string) {
    this._code = val;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor.setValue(val);
    }
  }

  @Input()
  public set language(val: string) {
    this._language = val;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor.setModelLanguage(val);
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
  public set theme(val: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light') {
    this._theme = val;
    if (this.codeEditorService.loaded && this._editor) {
      this._editor._themeService.setTheme(val);
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

  constructor(private codeEditorService: CodeEditorService) {}

  private initMonaco(): void {
    if (!this.codeEditorService.loaded) {
      this.loadSub = this.codeEditorService.loadingFinished.pipe(first()).subscribe(() => {
        this.initMonaco();
      });
      return;
    }

    const options = {
      value: this._code,
      language: this._language,
      minimap: {
        enabled: this._minimapEnabled,
      },
      theme: this._theme,
      readonly: this._readonly,
      tabSize: this._tabSize,
    };

    this._editor = monaco.editor.create(this._editorContainer.nativeElement, options);

    if (this._windowResizeSubscription) {
      this._windowResizeSubscription.unsubscribe();
    }
    this._windowResizeSubscription = fromEvent(window, 'resize')
      .pipe(debounceTime(0))
      .subscribe(() => {
        this._editor.layout();
        console.log('resize :)');
      });
  }

  ngAfterViewInit(): void {
    this.initMonaco();
  }

  ngOnDestroy(): void {
    if (this.loadSub) this.loadSub.unsubscribe();
    if (this._windowResizeSubscription) this._windowResizeSubscription.unsubscribe();
    if (this._editor) {
      this._editor.dispose();
      this._editor = undefined;
    }
  }
}
