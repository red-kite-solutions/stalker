import { CdkMenuItem, CdkMenuModule } from '@angular/cdk/menu';
import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  Output,
  QueryList,
  TemplateRef,
  ViewChild,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SearchQueryParser } from '@red-kite/common/search-query';
import { SearchHelper } from '@red-kite/frontend/app/utils/normalize-search-string';
import { BehaviorSubject, combineLatest, filter, map, shareReplay, startWith, switchMap } from 'rxjs';
import { Autocomplete, Suggestion } from '../filtered-paginated-table/autocomplete/autocomplete';

@Component({
  standalone: true,
  selector: 'rks-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatTooltipModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatOptionModule,
    MatDividerModule,
    CdkMenuModule,
  ],
  styleUrl: './search-input.component.scss',
  templateUrl: './search-input.component.html',
})
export class SearchInputComponent implements OnDestroy {
  private readonly parser = new SearchQueryParser();

  @Input() public autocomplete: Autocomplete | undefined | null;

  @ViewChild('queryInput', { read: ElementRef }) queryInput!: ElementRef;
  @ViewChild('autocompleteOrigin', { read: ElementRef }) autocompleteOrigin!: ElementRef;
  @ViewChild('autocompleteTemplate') autocompleteTemplate!: TemplateRef<any>;
  @ViewChildren(CdkMenuItem) menuItems!: QueryList<CdkMenuItem>;

  public hasInputFocus = false;
  public hasMenuFocus = false;
  private overlayRef!: OverlayRef;
  public queryForm = this.fb.group({
    query: this.fb.control(''),
  });

  public parsedQuery$ = this.queryForm.controls.query.valueChanges.pipe(
    startWith(this.queryForm.value.query),
    map((x) => {
      try {
        return this.parser.parse(x || '');
      } catch (e) {
        console.error(e);
      }

      return [];
    }),
    shareReplay(1)
  );

  @Output('queryChange') queryChange$ = this.parsedQuery$.pipe(filter((x) => x.every((x) => !x.incomplete)));

  private refreshSuggestions$ = new BehaviorSubject<void>(undefined);
  public suggestions$ = combineLatest([this.parsedQuery$, this.refreshSuggestions$]).pipe(
    switchMap(([query]) => this.autocomplete?.suggest(query) || []),
    shareReplay(1)
  );

  constructor(
    private fb: FormBuilder,
    private overlay: Overlay,
    private positionBuilder: OverlayPositionBuilder,
    private vcr: ViewContainerRef
  ) {}

  initOverlay() {
    const positionStrategy = this.positionBuilder.flexibleConnectedTo(this.autocompleteOrigin).withPositions([
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 4,
      },
    ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: false,
    });
  }

  async selectSuggestion(suggestion: Suggestion) {
    if (!suggestion) return;

    const query = this.queryForm.controls.query.value || '';
    for (let i = suggestion.value.length - 1; i >= 0; --i) {
      const part = suggestion.value.slice(0, i);
      if (SearchHelper.endsWith(query, part)) {
        this.queryForm.controls.query.setValue(`${query.slice(0, query.length - i)}${suggestion.value}`);
        break;
      }
    }

    (this.queryInput.nativeElement as HTMLElement).focus();
    this.refreshSuggestions$.next();
  }

  openAutocomplete() {
    if (!this.autocompleteOrigin) return;
    if (!this.overlayRef) {
      this.initOverlay();
    }

    if (!this.overlayRef.hasAttached()) {
      this.overlayRef.attach(new TemplatePortal(this.autocompleteTemplate, this.vcr));
    }
  }

  closeAutocompleteIfNeeded() {
    if (this.hasInputFocus || this.hasMenuFocus) return;

    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  onInputFocus() {
    this.hasInputFocus = true;
    this.openAutocomplete();
  }

  onInputBlur() {
    // Give time to call "selectSuggetsion". Otherwise, the menu disappears before the items (click) is called.
    this.hasInputFocus = false;
    setTimeout(() => this.closeAutocompleteIfNeeded(), 100);
  }

  onSuggestionFocus() {
    this.hasMenuFocus = true;
    this.openAutocomplete();
  }

  onSuggestioBlur() {
    this.hasMenuFocus = false;
    setTimeout(() => this.closeAutocompleteIfNeeded(), 100);
  }

  onKeyDown(event: KeyboardEvent) {
    const focusKeys = ['ArrowDown', 'Tab'];

    if (focusKeys.includes(event.key)) {
      this.hasMenuFocus = true;
      const items = this.menuItems?.toArray();
      if (items?.length) {
        event.preventDefault();
        (items[0]._elementRef.nativeElement as HTMLElement).focus();
      }
    }

    const blurKeys = ['Escape'];
    if (blurKeys.includes(event.key)) {
      this.hasMenuFocus = false;
      this.hasInputFocus = false;
      this.closeAutocompleteIfNeeded();
    }
  }

  ngOnDestroy() {
    this.overlayRef?.dispose();
  }
}
