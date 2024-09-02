import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-no-data-select-item',
  template: `
    <div class="no-data">
      <div class="no-data-icons">
        <span class="material-symbols-outlined"> check_box_outline_blank </span>
        <span class="material-symbols-outlined"> east </span>
        <span class="material-symbols-outlined"> check_box </span>
      </div>
      <div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .no-data {
        .no-data-icons {
          margin-top: 10px;
          margin-bottom: 10px;
          display: flex;
          flex-direction: row;
          justify-content: center;
          user-select: none;
          opacity: 0.65;
          fill: currentColor;

          span {
            flex-grow: 0;
            font-size: 4em;
          }
        }
      }
    `,
  ],
  imports: [],
})
export class NoDataSelectItemComponent {}
