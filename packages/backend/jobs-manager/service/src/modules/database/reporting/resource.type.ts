export const resourceTypes = ['domain', 'host', 'port', 'website'] as const;
export type ResourceType = (typeof resourceTypes)[number];
