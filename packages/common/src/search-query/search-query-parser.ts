import * as searchParser from './generated/search-parser';
import {
  isFindingFieldTerm,
  isFindingTerm,
  SearchTerm,
  SearchTerms,
} from './search-query-parser.types';

export interface ParseOptions {
  completeTermsOnly?: boolean;
  excludeEmptyValues?: boolean;
}

export class SearchQueryParser {
  public parse(query: string, options?: ParseOptions): SearchTerms {
    let terms = searchParser.parse(query) as SearchTerms;
    if (options?.completeTermsOnly) {
      terms = terms.filter((x) => !x.incomplete);
    }

    if (options?.excludeEmptyValues) {
      terms = terms.filter((x) => x.value != null && x.value !== '');
    }

    return terms;
  }

  public toQueryString(query: string | SearchTerms) {
    if (!query) return '';
    if (typeof query === 'string') return query;

    return query
      .filter((x) => !x.incomplete && x.value != null)
      .map((x) => this.toTermString(x))
      .join(' ');
  }

  private toTermString(term: SearchTerm) {
    let key = term.originalType;
    if (isFindingTerm(term)) {
      key = `finding.${term.key.findingKey}`;
    }

    if (isFindingFieldTerm(term)) {
      key = `finding.${term.key.findingKey}.${term.key.fieldKey}`;
    }

    const spacesBeforeKey = ' '.repeat(term.spacesBeforeKey ?? 0);
    const not = term.not ? '-' : '';
    const spacesAfterKey = ' '.repeat(term.spacesAfterKey ?? 0);
    const spacesBeforeValue = ' '.repeat(term.spacesBeforeValue ?? 0);
    const quoteBefore = term.quoteBefore ? '"' : '';
    const value = term.value;
    const quoteAfter = term.quoteAfter ? '"' : '';
    const spacesAfterValue = ' '.repeat(term.spacesAfterValue ?? 0);

    return `${spacesBeforeKey}${not}${key}${spacesAfterKey}:${spacesBeforeValue}${quoteBefore}${value}${quoteAfter}${spacesAfterValue}`;
  }
}
