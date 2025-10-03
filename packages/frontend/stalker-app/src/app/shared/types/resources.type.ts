import { IdentifiedElement } from './identified-element.type';

export type ResourceType = 'domain' | 'host' | 'port' | 'website';

export type Resource = IdentifiedElement & {
  correlationKey: string;
};
