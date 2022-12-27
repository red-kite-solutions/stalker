export type CustomFindingFieldDto =
  | CustomFindingImageFieldDto
  | CustomFindingTextFieldDto;

export class CustomFindingImageFieldDto {
  public readonly type = 'image';
  public data: string;
}

export class CustomFindingTextFieldDto {
  public readonly type = 'text';
  public label: string;
  public content: string;
}

/**
 * Represents a finding.
 */
export class CustomFindingDto {
  public target: string;
  public targetName: string;
  public created: Date;
  public name: string;
  public key: string;
  public jobId: string;
  public fields: CustomFindingFieldDto[];
}
