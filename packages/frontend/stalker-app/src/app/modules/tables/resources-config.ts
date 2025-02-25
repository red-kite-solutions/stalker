import { ResourceType } from '../../shared/types/resources.type';

interface ResourceTableConfig {
  baseColumns: string[];
}

export const resourcesTableConfig: Record<ResourceType, ResourceTableConfig> = {
  domains: { baseColumns: ['name', 'project'] },
  hosts: { baseColumns: ['name', 'project'] },
  ports: { baseColumns: ['name', 'project'] },
  websites: { baseColumns: ['name', 'project'] },
};
