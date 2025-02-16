import { IsIn, IsOptional } from 'class-validator';

export const sortDirections = ['ascending', 'descending'] as const;
export type SortDirection = (typeof sortDirections)[number];

export class SortDto {
  @IsIn(sortDirections)
  @IsOptional()
  sort?: SortDirection;
}
