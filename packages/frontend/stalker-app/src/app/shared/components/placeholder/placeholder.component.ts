import { Component } from '@angular/core';

@Component({
  selector: 'rk-placeholder',
  standalone: true,
  template: `
    <div
      class="tw-w-full tw-h-[1em] tw-bg-gray-500 tw-rounded-lg tw-opacity-25 tw-animate-[pulse_2s_ease-in-out_infinite]"
    ></div>
  `,
  styles: [],
})
export class PlaceholderComponent {}
