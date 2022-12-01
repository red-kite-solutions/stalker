import { Component } from '@angular/core';
import { CodeEditorService } from 'src/app/shared/widget/code-editor/code-editor.service';

@Component({
  selector: 'app-automation',
  templateUrl: './automation.component.html',
  styleUrls: ['./automation.component.scss'],
})
export class AutomationComponent {
  public code = 'asdf: asdf';
  public language = 'yaml';
  public minimapEnabled = false;
  public theme: 'vs-dark' = 'vs-dark';
  public readonly = false;

  constructor(private codeEditorService: CodeEditorService) {
    this.codeEditorService.load();
  }

  public Test() {
    this.minimapEnabled = !this.minimapEnabled;
  }
}
