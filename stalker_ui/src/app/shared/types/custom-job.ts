export interface CustomJob extends CustomJobData {
  _id: string;
}

export interface CustomJobData {
  name: string;
  code: string;
  type: string;
  language: string;
}
