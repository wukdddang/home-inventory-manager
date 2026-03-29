import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHouseholdDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  kind?: string;
}
