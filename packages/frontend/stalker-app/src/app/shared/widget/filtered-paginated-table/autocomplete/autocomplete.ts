import { SearchTerm, SearchTerms } from '@red-kite/common/search-query';
import { SearchHelper } from '@red-kite/frontend/app/utils/normalize-search-string';

/**
 * Describes what an autocomplete targets. "Key" is before the colon, "Value" is after the colon.
 * @example key: value
 */
export type AutocompleteTarget = 'key' | 'value';

/** A suggestion. */
export interface Suggestion {
  type: 'suggestion';
  icon?: string;
  value: string;
  name?: string;
  autocomplete?: Autocomplete;
}

/** A divider to create suggestion groups. */
export interface Divider {
  type: 'divider';
}

export abstract class Autocomplete {
  protected abstract target: AutocompleteTarget;

  async suggest(terms: SearchTerms): Promise<(Suggestion | Divider)[]> {
    const lastTerm = terms[terms.length - 1];
    const suggestions = await this.getSuggestions();
    if (!lastTerm || lastTerm.spacesAfterValue) {
      return suggestions;
    }

    const target = this.getTarget(lastTerm);
    const matches = suggestions.filter(
      (x) =>
        x.type !== 'suggestion' ||
        SearchHelper.startsWith(x.name || '', target) ||
        SearchHelper.startsWith(x.value, target)
    );

    if (matches.filter((x) => x.type === 'suggestion').length > 1) {
      return matches;
    }

    const match = matches[0] as Suggestion;
    if (match.value !== target && match.name !== target) {
      return matches;
    }

    return (await match.autocomplete?.suggest(terms)) || [];
  }

  private async getSuggestions(): Promise<(Suggestion | Divider)[]> {
    const suggestions = await this.getSuggestionsCore();
    return suggestions?.map((suggestion) => {
      if (this.target !== 'value') return suggestion;
      if (suggestion.type !== 'suggestion') return suggestion;

      const hasSpaces = suggestion.value.includes(' ');
      if (hasSpaces) {
        suggestion = { ...suggestion, value: `"${suggestion.value}"` };
      }

      if (this.target === 'value') {
        suggestion = { ...suggestion, value: `${suggestion.value} ` };
      }

      return suggestion;
    });
  }

  protected abstract getSuggestionsCore(): Promise<(Suggestion | Divider)[]>;

  private getTarget(term: SearchTerm) {
    if (!term) return '';

    const target = this.target === 'key' ? term.originalType : term.value;
    return target || '';
  }
}
