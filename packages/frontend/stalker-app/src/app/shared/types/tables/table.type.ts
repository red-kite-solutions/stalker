import { ResourceType } from '../resources.type';

export interface TableField {
  id: string;
  name: string;
  findingKey: string;
  findingFieldKey: string;
}

export interface Table {
  id: string;
  name: string;
  resource: ResourceType;
  isPinned: boolean;
  icon: string;
  fields: TableField[];
}
