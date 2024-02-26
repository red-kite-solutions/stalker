import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanizeDate',
  pure: true,
})
export class HumanizeDatePipe implements PipeTransform {
  transform(milliseconds: number, precision: 'approximate' | 'precise' = 'approximate'): string {
    if (!milliseconds) return '';
    return precision === 'approximate' ? this.approximate(milliseconds) : this.precise(milliseconds);
  }

  private approximate(milliseconds: number) {
    const date = new Date(milliseconds);
    const m = date.getMonth() + 1; // Months start at 0
    const mm = m >= 10 ? m.toString() : '0' + m.toString();
    const d = date.getDate();
    const dd = d >= 10 ? d.toString() : '0' + d.toString();

    return `${date.getFullYear()}-${mm}-${dd}`;
  }

  private precise(milliseconds: number) {
    const date = new Date(milliseconds);
    const h = date.getHours();
    const hh = h >= 10 ? h.toString() : '0' + h.toString();
    const m = date.getMinutes();
    const mm = m >= 10 ? m.toString() : '0' + m.toString();
    const s = date.getSeconds();
    const ss = s >= 10 ? s.toString() : '0' + s.toString();
    return `${this.approximate(milliseconds)} ${hh}:${mm}:${ss}`;
  }
}
