import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * The default time for which an item is considered new for the NewPillTagComponent
 * It corresponds to one week in milliseconds.
 */
export const defaultNewTimeMs = 1000 * 60 * 60 * 24 * 7;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-new-pill-tag',
  template: `
    @if (isNew()) {
      <app-pill-tag [color]="tagColor" [matTooltip]="_createdAtMs | timeAgo" matTooltipShowDelay="500">{{
        tagText
      }}</app-pill-tag>
    }
  `,
})
export class NewPillTagComponent {
  public _createdAtMs: number = 0;

  public _newTimeMs: number = defaultNewTimeMs;

  /** Default green */
  @Input() tagColor: string = '#11720e';
  @Input() tagText: string = $localize`:New item tag|Tag text that identifies an item as new:New!`;

  /** Time at which the item was created, in seconds */
  @Input() set createdAtSeconds(value: number) {
    this._createdAtMs = value * 1000;
  }

  /** Time at which the item was created, in milliseconds */
  @Input() set createdAtMilliseconds(value: number) {
    this._createdAtMs = value;
  }

  /** Time after createdAt for which the tag should appear, in seconds. Default is one week. */
  @Input() set newTimeSeconds(value: number) {
    this._newTimeMs = value * 1000;
  }

  /** Time after createdAt for which the tag should appear, in milliseconds. Default is one week. */
  @Input() set newTimeMilliseconds(value: number) {
    this._newTimeMs = value;
  }

  public isNew() {
    return this._createdAtMs > 0 && this._createdAtMs + this._newTimeMs >= Date.now();
  }
}
