/** Base type for a single search term */
export type SearchTerm = DomainHostPortTerm | IsTerm | FindingTerm | FindingFieldTerm | IncompleteTerm;

interface IncompleteTerm {
  /** Indicates if the term is incomplete */
  incomplete?: true;
  /** Indicates if the term is negated with "-" */
  not: boolean;
  /** Key for this term. */
  key: string;
  /** Type for these terms */
  type: null;
  /** The value for the term */
  value: null;
}

/** Term for domain, host, port or tags */
interface DomainHostPortTerm {
  /** Indicates if the term is incomplete */
  incomplete?: boolean;
  /** Indicates if the term is negated with "-" */
  not: boolean;
  /** Type for these terms */
  type: 'domain' | 'host' | 'port' | 'tags';
  /** The value for the term */
  value: string | null;
}

/** Term for "is" type */
interface IsTerm {
  /** Indicates if the term is incomplete */
  incomplete?: boolean;
  /** Indicates if the term is negated with "!" */
  not: boolean;
  /** Explicit type for "is" term */
  type: 'is';
  /** The value for the term */
  value: string | null;
}

/** Term for finding type */
interface FindingTerm {
  /** Indicates if the term is incomplete */
  incomplete?: boolean;
  /** Indicates if the term is negated with "!" */
  not: boolean;
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
interface FindingFieldTerm {
  /** Indicates if the term is incomplete */
  incomplete?: boolean;
  /** Indicates if the term is negated with "!" */
  not: boolean;
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
