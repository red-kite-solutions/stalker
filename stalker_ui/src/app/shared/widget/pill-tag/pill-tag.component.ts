import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-pill-tag',
  templateUrl: './pill-tag.component.html',
  styleUrls: ['./pill-tag.component.scss'],
})
export class PillTagComponent implements OnChanges {
  @Input() color = '#991822';

  bgColor = this.colorToBackgroundColor(this.color);
  border = this.colorToBorderColor(this.color);

  ngOnChanges(): void {
    this.bgColor = this.colorToBackgroundColor(this.color);
    this.border = this.colorToBorderColor(this.color);
  }

  private colorToBackgroundColor(c: string) {
    const rgb = this.hexToRgb(c);
    if (!rgb) return '#eff4ff';
    return `rgb(${rgb.r},${rgb.g},${rgb?.b},0.1)`;
  }

  private colorToBorderColor(c: string) {
    const rgb = this.hexToRgb(c);
    if (!rgb) return '#eff4ff';
    return `1px solid rgb(${rgb.r},${rgb.g},${rgb?.b},0.8)`;
  }

  // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  private hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }
}
