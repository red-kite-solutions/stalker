import { IdentifiedElement } from './identified-element.type';

export type ResourceType = 'domains' | 'hosts' | 'ports' | 'websites';

export type Resource = IdentifiedElement & {
  correlationKey: string;
};
