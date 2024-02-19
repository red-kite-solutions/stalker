import { RequireAtLeastOne } from './require-at-least-one.type';

interface IdElement {
  _id?: string;
  id?: string;
}

export type IdentifiedElement = RequireAtLeastOne<IdElement, '_id' | 'id'>;
