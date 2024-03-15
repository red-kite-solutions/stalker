import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgxFileDropEntry } from 'ngx-file-drop';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent {
  @Input() public fileSelected = false;
  @Output() fileSelectedChange = new EventEmitter<boolean>();

  @Input() public previewSource: string | undefined;
  @Output() previewSourceChange = new EventEmitter<string | undefined>();

  @Input() public fileLoading = false;
  @Output() fileLoadingChange = new EventEmitter<boolean>();

  public dropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (!droppedFile.fileEntry.isFile) return;

      this.fileLoading = true;
      this.fileLoadingChange.emit(this.fileLoading);
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file((file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          this.previewSource = event.target?.result?.toString();
          this.previewSourceChange.emit(this.previewSource);
          this.fileSelected = true;
          this.fileSelectedChange.emit(this.fileSelected);
          this.fileLoading = false;
          this.fileLoadingChange.emit(this.fileLoading);
        };
      });
    }
  }

  public resetImage() {
    this.fileSelected = false;
    this.fileSelectedChange.emit(this.fileSelected);
    this.previewSource = '';
    this.previewSourceChange.emit(this.previewSource);
  }
}
