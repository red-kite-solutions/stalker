import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'memoryUnits',
  pure: true,
})
export class MemoryUnitsPipe implements PipeTransform {
  transform(memoryKBytes: number): string {
    if (!memoryKBytes) return '';

    const gb = memoryKBytes / (1024 * 1024);
    const mb = memoryKBytes / 1024;

    if (gb >= 1) {
      return `${gb.toPrecision(3).toString()} GB`;
    }

    if (mb >= 1) {
      return `${mb.toPrecision(3).toString()} MB`;
    }

    return `${memoryKBytes.toString()} KB`;
  }
}
