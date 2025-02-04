import * as searchParser from './generated/search-parser';
import {
  isFindingFieldTerm,
  isFindingTerm,
  SearchTerms,
} from './search-query-parser.types';

export class SearchQueryParser {
  public parse(query: string): SearchTerms {
    return searchParser.parse(query);
  }

  public toQueryString(query: string | SearchTerms) {
    if (typeof query === 'string') return query;

    return query
      .filter((x) => !x.incomplete && x.value != null)
      .map((x) => {
        if (isFindingTerm(x)) {
          return `${x.not ? '-' : ''}finding.${x.key.findingKey}: ${x.value}`;
        }

        if (isFindingFieldTerm(x)) {
          return `${x.not ? '-' : ''}finding.${x.key.findingKey}.${
            x.key.fieldKey
          }: ${x.value}`;
        }

        return `${x.not ? '-' : ''}${x.type}: ${x.value}`;
      })
      .join(' ');
  }
}
