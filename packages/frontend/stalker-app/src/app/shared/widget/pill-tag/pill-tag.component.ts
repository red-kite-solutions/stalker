import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-pill-tag',
  templateUrl: './pill-tag.component.html',
  styleUrls: ['./pill-tag.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillTagComponent {
  @Input() color = '#991822';

  public get colorHsl() {
    return this.hexToHsl(this.color);
  }

  public get colorRgb() {
    return this.hexToRgb(this.color);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    return { r, g, b };
  }

  // Ref.: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
  // Ref.: https://stackoverflow.com/questions/3732046/how-do-you-get-the-hue-of-a-xxxxxx-colour
  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const { r, g, b } = this.hexToRgb(hex);

    let max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s,
      l = (max + min) / 2;

    if (max == min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h, s, l };
  }
}
