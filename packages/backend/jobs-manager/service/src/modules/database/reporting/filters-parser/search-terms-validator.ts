import {
  SearchTerm,
  SearchTerms,
} from '@red-kite/jobs-manager/common-duplicates/search-query';
import { isIP } from 'class-validator';
import { ObjectId } from 'mongodb';
import { HttpBadRequestException } from '../../../../exceptions/http.exceptions';

export class SearchTermsValidator {
  public ensureTerms(terms: SearchTerms): void {
    for (const term of terms) {
      switch (term.type) {
        case 'is':
          return this.ensureAllowedValues(term, ['blocked', 'merged']);

        case 'domain.id':
        case 'tag.id':
        case 'host.id':
        case 'port.id':
        case 'project.id':
        case 'mergedIn.id':
        case 'ipRange.id':
        case 'website.id':
          return this.ensureObjectId(term);

        case 'port.number':
          return this.ensureNumber(term);

        case 'port.protocol':
          return this.ensureAllowedValues(term, ['udp', 'tcp']);

        case 'finding':
          return this.ensureAllowedValues(term, ['exists']);

        case 'host.ip':
        case 'domain.name':
        case 'tag.name':
        case 'project.name':
        case 'findingField':
        case 'ipRange.cidr':
          // No validation required
          return;

        default:
          throw new HttpBadRequestException(
            `${(term as any)?.type} filter not allowed.`,
          );
      }
    }
  }

  protected ensureAllowedValues(
    { value, type }: SearchTerm,
    allowedValues: string[],
  ) {
    if (allowedValues.includes(value)) return;

    throw new HttpBadRequestException(
      `Value ${value} not allowed for ${type} filter.`,
    );
  }

  protected ensureObjectId({ value, type }: SearchTerm) {
    if (ObjectId.isValid(value)) return;

    throw new HttpBadRequestException(
      `Value should be an ObjectId for ${type} filter.`,
    );
  }

  protected ensureNumber({ value, type }: SearchTerm) {
    if (!Number.isNaN(value)) return;

    throw new HttpBadRequestException(
      `Value should be a number for ${type} filter.`,
    );
  }

  protected ensureIp({ value, type }: SearchTerm) {
    if (isIP(value, 4) || isIP(value.replace(/\*$/, ''))) return;

    throw new HttpBadRequestException(
      `Value should be a valid IP address for ${type} filter, but got "${value}".`,
    );
  }
}
