import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAdjustmentDto {
  @IsNumber()
  quantityDelta: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
