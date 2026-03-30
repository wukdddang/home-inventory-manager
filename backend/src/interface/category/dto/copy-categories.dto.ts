import { IsUUID } from 'class-validator';

export class CopyCategoriesDto {
  @IsUUID()
  sourceHouseholdId: string;
}
