import { SearchQueryParser } from '@red-kite/common/search-query';
import { Observable, of } from 'rxjs';

export class GrammarSuggester {
  private parser = new SearchQueryParser();

  public suggest(query: string): Observable<string[]> {
    try {
      if (!query.length) return this.suggestTypes();

      const result = this.parser.parse(query);
      if (!result.length) return this.suggestTypes();

      const last = result[result.length - 1];
      const isComplete = !last.incomplete;
      if (isComplete && /[^:] $/.test(query)) return this.suggestTypes();

      if (!isComplete) {
        if (!last.type) {
          return this.suggestTypes(last.key);
        }

        if (last.type === 'finding') {
          return this.suggestFindings(last.key.findingKey);
        }
      } else {
        if (query[query.length - 1]) return of([]);
      }
    } catch (_) {
      // ignore
    }

    return of([]);
  }

  private suggestTypes(filter: string = ''): Observable<string[]> {
    return of(['domain: ', 'host: ', 'port: ', 'tags: ', 'is: ', 'finding.'].filter((x) => x.startsWith(filter)));
  }

  private suggestFindings(filter: string = ''): Observable<string[]> {
    return of(
      [
        'HostnameFinding',
        'IpFinding',
        'IpRangeFinding',
        'HostnameIpFinding',
        'PortFinding',
        'WebsiteFinding',
        'CustomFinding',
        'PortServiceFinding',
        'WebsitePathFinding',
        'TagFinding',
      ].filter((x) => x.startsWith(filter))
    );
  }
}
