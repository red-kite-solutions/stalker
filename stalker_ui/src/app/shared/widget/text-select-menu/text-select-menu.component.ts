import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SelectItem {
  isSelected: boolean;
  text: string;
  color?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-text-select-menu',
  templateUrl: './text-select-menu.component.html',
  styleUrls: ['./text-select-menu.component.scss'],
})
export class TextSelectMenuComponent {
  _items: SelectItem[] | undefined | null = null;
  _filter = '';

  @Input()
  set items(value: SelectItem[] | undefined | null) {
    this._items = value;
    this.filterItems();
  }
  get items() {
    return this._items;
  }
  shownItems: SelectItem[] | undefined | null = this.items;
  @Input() filterEnabled = true;
  @Input() colorEnabled = true;
  @Input()
  set filter(value: string) {
    this._filter = value;
    this.filterItems();
  }
  get filter(): string {
    return this._filter;
  }
  @Input() buttonText = $localize`:Click Here|:Click Here`;
  @Input() filterText = $localize`:Filter Items|Filter the items of a list:Filter Items`;
  @Input() emptyText = $localize`:No Items|The list is empty:No items available`;
  @Output() itemSelection = new EventEmitter<SelectItem>();

  /** Used to determine the menu width. Otherwise, uses the button width. */
  @Input() containerElement: HTMLElement | undefined = undefined;

  selectItem(event: Event, item: SelectItem) {
    event.stopPropagation();
    item.isSelected = !item.isSelected;
    this.itemSelection.emit(item);
  }

  filterItems() {
    if (!this._filter) {
      this.shownItems = this.items?.sort((a, b) => a.text.localeCompare(b.text));
      return;
    }

    this.shownItems = this.items?.filter((item) => {
      return item.text.toLowerCase().includes(this._filter.toLowerCase());
    });
  }
}
