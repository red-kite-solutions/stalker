export type FindingType = 'image' | 'data';

/**
 * Represents a generic finding.
 */
export interface CustomFinding {
  created: Date;
  name: string;
  key: string;
  jobId: string;
  fields: CustomFindingField[];
}

export type CustomFindingField = CustomFindingImageField | CustomFindingTextField;

export interface CustomFindingImageField {
  type: 'image';
  data: string;
  key: string;
}

export interface CustomFindingTextField {
  type: 'text';
  label: string;
  data: string;
  key: string;
}
