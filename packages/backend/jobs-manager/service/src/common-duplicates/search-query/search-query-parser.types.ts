/** Base type for a single search term */
export type SearchTerm =
  | NormalTerm
  | FindingTerm
  | FindingFieldTerm
  | IncompleteTerm;

export interface TermBase {
  /** The original type. Some types have simple aliases; this returns the version input in the query string.
   * @example host: 1.2.3.4 returns "host" as the original type
   */
  originalType?: string;

  /** Indicates whether this term has a colon. */
  hasColon?: boolean;

  /** Whether the value is prefixed with a quote. */
  quoteBefore?: boolean;

  /** Whether the value is suffixed with a quote. */
  quoteAfter?: boolean;

  /**
   * Number of spaces after the key.
   * @example [   ]my-query: 123
   */
  spacesBeforeKey?: number;

  /**
   * Number of spaces after the key.
   * @example my-query[  ]: 123
   */
  spacesAfterKey?: number;

  /**
   * Number of spaces before the value.
   * @example my-query:[   ]123
   */
  spacesBeforeValue?: number;

  /**
   * Number of spaces after the value.
   * @example my-query: 123[   ]
   */
  spacesAfterValue?: number;
}
export interface IncompleteTerm extends TermBase {
  /** Indicates if the term is incomplete */
  incomplete?: true;

  /** Indicates if the term is negated with "-" */
  not?: boolean;

  /** Key for this term. */
  key: string;

  /** Type for these terms */
  type: undefined | null;

  /** The value for the term */
  value: null;
}

export type TermTypes =
  | 'is'
  | 'project.id'
  | 'project.name'
  | 'domain.id'
  | 'domain.name'
  | 'host.id'
  | 'host.ip'
  | 'port.id'
  | 'port.number'
  | 'port.protocol'
  | 'port.service'
  | 'port.product'
  | 'port.version'
  | 'tag.name'
  | 'tag.id'
  | 'ipRange.id'
  | 'ipRange.cidr'
  | 'mergedIn.id'
  | 'website'
  | 'website.id'
  | 'unknown';

/** Normal term */
export interface NormalTerm extends TermBase {
  /** Indicates if the term is incomplete */
  incomplete?: boolean;

  /** Indicates if the term is negated with "-" */
  not?: boolean;

  /** Type for these terms */
  type: TermTypes;

  /** The value for the term */
  value: string | null;
}

/** Term for finding type */
export interface FindingTerm extends TermBase {
  /** Indicates if the term is incomplete */
  incomplete?: boolean;

  /** Indicates if the term is negated with "!" */
  not?: boolean;

  /** Explicit type for finding */
  type: 'finding';

  /** The key for the finding */
  key: {
    /** The main key for the finding */
    findingKey: string;
  };

  /** The value for the term */
  value: string | null;
}

/** Term for finding field type */
export interface FindingFieldTerm extends TermBase {
  /** Indicates if the term is incomplete */
  incomplete?: boolean;

  /** Indicates if the term is negated with "!" */
  not?: boolean;

  /** Explicit type for finding field */
  type: 'findingField';

  /** The key for the finding field */
  key: {
    /** The main key for the finding */
    findingKey: string;
    /** The field key for the finding */
    fieldKey: string;
  };

  /** The value for the term */
  value: string | null;
}

/** Type for a list of terms */
export type SearchTerms = SearchTerm[];

export function isFindingTerm(term: SearchTerm): term is FindingTerm {
  return term.type === 'finding';
}

export function isFindingFieldTerm(term: SearchTerm): term is FindingFieldTerm {
  return term.type === 'findingField';
}
