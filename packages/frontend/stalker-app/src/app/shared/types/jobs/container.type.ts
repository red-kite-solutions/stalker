export interface ContainerSummary {
  image: string;
  id: string;
}

// Will eventually have more fields.
export interface Container {
  _id: string;
  image: string;
}
