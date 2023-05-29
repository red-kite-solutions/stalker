import { RequireAtLeastOne } from './requireAtLeastOne.type';

interface IdElement {
  _id?: string;
  id?: string;
}

export type IdentifiedElement = RequireAtLeastOne<IdElement, '_id' | 'id'>;
