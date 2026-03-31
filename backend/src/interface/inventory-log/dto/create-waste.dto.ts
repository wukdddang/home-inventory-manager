import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWasteDto {
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  memo?: string;
}
