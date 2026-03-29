import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateHouseholdDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  kind?: string;
}
