import { Autocomplete, AutocompleteTarget, Divider, Suggestion } from './autocomplete';
import { AutocompleteBuilder } from './autocomplete-builder';
import { SuggestionOptions } from './suggestion-options';

export class StaticAutocomplete extends Autocomplete {
  private _suggestions: (Suggestion | Divider)[] = [];

  constructor(
    protected target: AutocompleteTarget,
    private builder: AutocompleteBuilder
  ) {
    super();
  }

  protected override async getSuggestionsCore(): Promise<(Suggestion | Divider)[]> {
    return this._suggestions;
  }

  suggestion(options: SuggestionOptions) {
    this._suggestions.push({
      type: 'suggestion',
      icon: options.icon,
      value: options.value,
      name: options.name ?? options.value,
      autocomplete: options.children !== '_self' ? options.children?.(this.builder) : this,
    });

    return this;
  }

  divider() {
    this._suggestions.push({ type: 'divider' });
    return this;
  }
}
