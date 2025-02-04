import { Injectable } from '@nestjs/common';
import {
  SearchQueryParser,
  SearchTerm,
  SearchTerms,
  TermTypes,
} from '@red-kite/jobs-manager/common-duplicates/search-query';
import escapeStringRegexp from '../../../../utils/escape-string-regexp';
import { SearchTermsValidator } from './search-terms-validator';

@Injectable()
export class FilterParserBase {
  protected queryParser = new SearchQueryParser();
  protected searchTermsValidator = new SearchTermsValidator();

  constructor() {}

  protected consumeTerms(
    terms: SearchTerms,
    not: '-' | '',
    type: TermTypes,
    value?: string,
  ): SearchTerms {
    const selected = [];

    for (let i = 0; i < terms.length; ) {
      const term = terms[i];
      if (
        term.type === type &&
        (not === '-') === term.not &&
        (value == null || term.value === value)
      ) {
        selected.push(terms[i]);
        terms.splice(i, 1);
      } else {
        i++;
      }
    }

    return selected;
  }

  protected toInclusionList(
    terms: SearchTerm[],
    options?: { lowercase: boolean },
  ): (string | RegExp)[] {
    let values = terms.map((x) => x.value).map((x) => x.trim());
    if (options?.lowercase) {
      values = values.map((x) => x.toLowerCase());
    }

    if (values.some((x) => x[x.length - 1] === '*')) {
      return values
        .map((x) => escapeStringRegexp(x))
        .map(
          (x) =>
            new RegExp(
              `^${x.substring(0, x.length - 2)}${
                x[x.length - 1] === '*' ? '.*' : x[x.length - 1]
              }`,
            ),
        );
    } else {
      return values;
    }
  }
}
