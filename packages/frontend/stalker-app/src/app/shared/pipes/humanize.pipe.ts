import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'humanize',
  pure: true,
})
export class HumanizePipe implements PipeTransform {
  transform(milliseconds: number, precision: 'approximate' | 'precise' = 'approximate'): string {
    if (!milliseconds) return '';
    return precision === 'approximate' ? this.approximate(milliseconds) : this.precise(milliseconds);
  }

  private approximate(milliseconds: number) {
    const seconds = Math.round(milliseconds / 1000);
    if (seconds < 1) return $localize`:Sub second|Duration shorter than 1 second:< 1 second`;
    if (seconds === 1) return $localize`:1 second|1 second:1 second`;

    const minutes = Math.round(seconds / 60);
    if (minutes < 1) return $localize`:X seconds|Duration in seconds:${seconds} seconds`;
    if (minutes === 1) return $localize`:1 minute|1 minute:1 minute`;

    const hours = Math.round(minutes / 60);
    if (hours < 1) return $localize`:X minutes|Duration in minutes:${minutes} minutes`;
    if (hours === 1) return $localize`:1 hour|1 hour:1 hour`;

    const days = Math.round(hours / 24);
    if (days < 1) return $localize`:X hours|Duration in hours:${hours} hours`;
    if (days === 1) return $localize`:1 day|1 day:1 day`;

    return $localize`:X days|Duration in days:${days} days`;
  }

  private precise(milliseconds: number) {
    return '';
  }
}
