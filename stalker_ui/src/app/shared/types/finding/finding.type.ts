export type FindingType = 'image' | 'data';

/**
 * Represents a generic finding.
 */
export interface CustomFinding {
  created: Date; // TODO: The server will send a string, must translate to date
  name: string;
  key: string;
  jobId: string;
  fields: CustomFindingField[];
}

export type CustomFindingField = CustomFindingImageField | CustomFindingTextField;

export interface CustomFindingImageField {
  type: 'image';
  data: string;
}

export interface CustomFindingTextField {
  type: 'text';
  label: string;
  content: string;
}
