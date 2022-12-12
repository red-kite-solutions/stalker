export type FindingFieldDto = FindingImageFieldDto | FindingTextFieldDto;

export class FindingImageFieldDto {
  public readonly type = 'image';
  public data: string;
}

export class FindingTextFieldDto {
  public readonly type = 'text';
  public label: string;
  public content: string;
}

/**
 * Represents a finding.
 */
export class FindingDto {
  public target: string;
  public targetName: string;
  public created: Date;
  public name: string;
  public key: string;
  public jobId: string;
  public fields: FindingFieldDto[];
}
