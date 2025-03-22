import { ResourceType } from '../../shared/types/resources.type';

interface ResourceTableConfig {
  baseColumns: string[];
}

export const resourcesTableConfig: Record<ResourceType, ResourceTableConfig> = {
  domains: { baseColumns: ['domainName', 'project'] },
  hosts: { baseColumns: ['hostIp', 'project'] },
  ports: { baseColumns: ['port', 'portHost', 'project'] },
  websites: { baseColumns: ['websiteUrl', 'project'] },
};
