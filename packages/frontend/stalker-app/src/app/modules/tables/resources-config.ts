import { ResourceType } from '../../shared/types/resources.type';

interface ResourceTableConfig {
  baseColumns: string[];
}

export const resourcesTableConfig: Record<ResourceType, ResourceTableConfig> = {
  domain: { baseColumns: ['domainName', 'project'] },
  host: { baseColumns: ['hostIp', 'project'] },
  port: { baseColumns: ['port', 'portHost', 'project'] },
  website: { baseColumns: ['websiteUrl', 'project'] },
};
