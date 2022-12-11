export type FindingType = 'image' | 'data';

/**
 * Represents a generic finding.
 */
export interface Finding {
  created: Date; // TODO: The server will send a string, must translate to date
  name: string;
  key: string;
  jobId: string;
  fields: FindingField[];
}

export type FindingField = FindingImageField | FindingTextField;

export interface FindingImageField {
  type: 'image';
  data: string;
}

export interface FindingTextField {
  type: 'text';
  label: string;
  content: string;
}
