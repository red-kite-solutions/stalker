export interface MonacoOptions {
  theme?: string;
  value?: string;
  language?: string;
  minimap?: {
    enabled: boolean;
  };
  readOnly?: boolean;
  tabSize?: number;
  automaticLayout?: boolean;
}

export interface MonacoModel {
  id: string;
  uri: MonacoUri;
}

export interface MonacoUri {
  fragment: string;
  path: string;
  query: string;
  scheme: string;

  get fsPath(): string;
  toJSON(): MonacoUriComponents;
  toString(skipEncoding?: boolean): string;
  with(change: { authority?: string; fragment?: string; path?: string; query?: string; scheme?: string }): MonacoUri;

  /**
   * Creates a new Uri from a file system path, e.g. `c:\my\files`, `/usr/home`, or `\\server\share\some\path`.
   * @param path
   */
  file(path: string): MonacoUri;
  from(components: MonacoUriComponents, strict?: boolean): MonacoUri;
  isUri(thing: any): thing is MonacoUri;
  joinPath(uri: MonacoUri, ...pathFragment: string[]): MonacoUri;
  parse(value: string, _strict?: boolean): MonacoUri;
  revive(data: MonacoUri | MonacoUriComponents): MonacoUri;
}

export interface MonacoUriComponents {
  authority?: string;
  fragment?: string;
  path?: string;
  query?: string;
  scheme: string;
}
