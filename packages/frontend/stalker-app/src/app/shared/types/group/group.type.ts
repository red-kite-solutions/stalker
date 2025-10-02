export interface Group {
  _id: string;
  name: string;
  description: string;
  members: string[];
  scopes: string[];
  readonly?: boolean;
}
