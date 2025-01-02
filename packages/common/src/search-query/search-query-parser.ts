import * as searchParser from './generated/search-parser';
import { SearchTerms } from './search-query-parser.types';

export class SearchQueryParser {
  public parse(query: string): SearchTerms {
    return searchParser.parse(query);
  }
}
