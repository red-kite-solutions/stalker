export interface Secret {
  _id: string;
  name: string;
  value?: string;
  projectId?: string;
  description?: string;
}
